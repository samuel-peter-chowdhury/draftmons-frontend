import {
  generateSchedule,
  getFeasibilityError,
  getMaxFeasibleWeeks,
  type GeneratedWeek,
  type SchedulingTeamInput,
} from './scheduling';

/**
 * generateSchedule shuffles internally, so week-count correctness has to be
 * asserted over repeated trials rather than a single deterministic run — the
 * round-count overshoot bug this suite guards against only surfaced on some
 * shuffles.
 */
const TRIALS_PER_COMBINATION = 30;
const MIN_TEAM_COUNT = 2;
const MAX_TEAM_COUNT = 24;

const teamCounts = Array.from(
  { length: MAX_TEAM_COUNT - MIN_TEAM_COUNT + 1 },
  (_, i) => MIN_TEAM_COUNT + i,
);

/** Distinct skill levels, so the balancing local search has real improving swaps to find. */
function makeTeams(teamCount: number): SchedulingTeamInput[] {
  return Array.from({ length: teamCount }, (_, i) => ({ teamId: i + 1, skillLevel: i + 1 }));
}

function pairingKey(teamAId: number, teamBId: number): string {
  return teamAId < teamBId ? `${teamAId}-${teamBId}` : `${teamBId}-${teamAId}`;
}

function findRepeatedMatchup(weeks: GeneratedWeek[]): string | null {
  const seen = new Set<string>();
  for (const week of weeks) {
    for (const pairing of week.pairings) {
      const key = pairingKey(pairing.teamAId, pairing.teamBId);
      if (seen.has(key)) return key;
      seen.add(key);
    }
  }
  return null;
}

describe('getMaxFeasibleWeeks', () => {
  it('returns 0 for fewer than 2 teams', () => {
    expect(getMaxFeasibleWeeks(0)).toBe(0);
    expect(getMaxFeasibleWeeks(1)).toBe(0);
  });

  it('returns teamCount - 1 for even team counts', () => {
    expect(getMaxFeasibleWeeks(2)).toBe(1);
    expect(getMaxFeasibleWeeks(4)).toBe(3);
    expect(getMaxFeasibleWeeks(18)).toBe(17);
    expect(getMaxFeasibleWeeks(24)).toBe(23);
  });

  it('returns teamCount for odd team counts (the phantom bye slot adds a round)', () => {
    expect(getMaxFeasibleWeeks(3)).toBe(3);
    expect(getMaxFeasibleWeeks(5)).toBe(5);
    expect(getMaxFeasibleWeeks(17)).toBe(17);
    expect(getMaxFeasibleWeeks(23)).toBe(23);
  });
});

describe('getFeasibilityError', () => {
  it('rejects fewer than 2 teams', () => {
    expect(getFeasibilityError(1, 1)).toMatch(/At least 2 teams/);
  });

  // Pinned literally, so a regression in getMaxFeasibleWeeks can't move the
  // boundary these assertions are checking along with it.
  it('accepts up to 17 weeks for 17 teams and rejects 18', () => {
    expect(getFeasibilityError(17, 17)).toBeNull();
    expect(getFeasibilityError(17, 18)).not.toBeNull();
  });

  it('accepts up to 17 weeks for 18 teams and rejects 18', () => {
    expect(getFeasibilityError(18, 17)).toBeNull();
    expect(getFeasibilityError(18, 18)).not.toBeNull();
  });

  for (const teamCount of [17, 18]) {
    const parity = teamCount % 2 === 0 ? 'even' : 'odd';

    it(`accepts every week count up to the max for an ${parity} count of ${teamCount} teams`, () => {
      const maxWeeks = getMaxFeasibleWeeks(teamCount);
      for (let numberOfWeeks = 1; numberOfWeeks <= maxWeeks; numberOfWeeks++) {
        expect(getFeasibilityError(teamCount, numberOfWeeks)).toBeNull();
      }
    });

    it(`rejects one week beyond the max for an ${parity} count of ${teamCount} teams`, () => {
      const maxWeeks = getMaxFeasibleWeeks(teamCount);
      expect(getFeasibilityError(teamCount, maxWeeks + 1)).toContain(`at most ${maxWeeks} weeks`);
    });
  }
});

describe('generateSchedule', () => {
  // One test per team count keeps failures readable and each test's runtime bounded.
  for (const teamCount of teamCounts) {
    it(`produces exactly numberOfWeeks weeks for every feasible week count with ${teamCount} teams`, () => {
      const teams = makeTeams(teamCount);
      const maxWeeks = getMaxFeasibleWeeks(teamCount);
      const mismatches: string[] = [];

      for (let numberOfWeeks = 1; numberOfWeeks <= maxWeeks; numberOfWeeks++) {
        for (let trial = 0; trial < TRIALS_PER_COMBINATION; trial++) {
          const { weeks } = generateSchedule(teams, numberOfWeeks);
          if (weeks.length !== numberOfWeeks) {
            mismatches.push(
              `numberOfWeeks=${numberOfWeeks} trial=${trial} produced ${weeks.length} weeks`,
            );
          }
        }
      }

      expect(mismatches).toEqual([]);
    });
  }

  it('throws when numberOfWeeks exceeds what the team count allows', () => {
    expect(() => generateSchedule(makeTeams(18), 18)).toThrow(/at most 17 weeks/);
  });

  // The originally reported repro: 18 teams / 10 weeks came back as 14-17 weeks.
  it('respects numberOfWeeks for the reported 18-team, 10-week case', () => {
    const teams = makeTeams(18);
    for (let trial = 0; trial < TRIALS_PER_COMBINATION; trial++) {
      expect(generateSchedule(teams, 10).weeks).toHaveLength(10);
    }
  });

  for (const teamCount of [18, 17]) {
    const parity = teamCount % 2 === 0 ? 'even' : 'odd';
    const expectedPairings = Math.floor(teamCount / 2);

    it(`never repeats a matchup and byes only on odd counts for ${parity} ${teamCount} teams`, () => {
      const teams = makeTeams(teamCount);
      const teamIds = new Set(teams.map((t) => t.teamId));

      for (let trial = 0; trial < TRIALS_PER_COMBINATION; trial++) {
        const { weeks } = generateSchedule(teams, 10);
        expect(findRepeatedMatchup(weeks)).toBeNull();

        for (const week of weeks) {
          expect(week.pairings).toHaveLength(expectedPairings);
          if (teamCount % 2 === 0) {
            expect(week.byeTeamId).toBeNull();
          } else {
            expect(week.byeTeamId).not.toBeNull();
            expect(teamIds.has(week.byeTeamId as number)).toBe(true);
          }
        }
      }
    });
  }
});
