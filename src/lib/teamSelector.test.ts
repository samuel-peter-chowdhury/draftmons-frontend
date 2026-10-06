import type { MatchInput, TeamInput, WeekInput } from '@/types';

import {
  buildTeamSelectorGroups,
  findMyTeam,
  findNextOpponentTeam,
  findNextOpponentTeamId,
} from './teamSelector';

const BASE = { isActive: true, createdAt: '', updatedAt: '' };

function makeTeam(id: number, name: string, userId: number | null = null): TeamInput {
  return { ...BASE, id, name, seasonId: 1, userId };
}

/**
 * `MatchInput` types `winningTeamId` / `losingTeamId` as non-nullable numbers, but an
 * unplayed match really comes back with both null — which is why the production rule
 * tests them for falsiness. The cast keeps the fixtures faithful to the wire shape.
 */
function makeMatch(
  id: number,
  teams: TeamInput[] | undefined,
  result?: { winningTeamId: number; losingTeamId: number },
): MatchInput {
  return {
    ...BASE,
    id,
    weekId: 1,
    teams,
    winningTeamId: result?.winningTeamId ?? null,
    losingTeamId: result?.losingTeamId ?? null,
  } as unknown as MatchInput;
}

function makeWeek(weekNumber: number, matches: MatchInput[] | undefined): WeekInput {
  return {
    ...BASE,
    id: weekNumber,
    name: `Week ${weekNumber}`,
    weekNumber,
    seasonId: 1,
    matches,
  };
}

// Scrambled insertion order on purpose — the API returns teams unordered, which is
// the whole reason this module exists.
const MY_USER_ID = 42;
const mine = makeTeam(1, 'Alakazam Alliance', MY_USER_ID);
const dragonite = makeTeam(2, 'Dragonite Dynasty');
const zapdos = makeTeam(3, 'Zapdos Zealots');
const bronzong = makeTeam(4, 'Bronzong Brigade');
const cresselia = makeTeam(5, 'Cresselia Crew');
const empoleon = makeTeam(6, 'Empoleon Empire');
const TEAMS: TeamInput[] = [dragonite, zapdos, mine, empoleon, bronzong, cresselia];

describe('findMyTeam', () => {
  it('returns the team whose userId matches', () => {
    expect(findMyTeam(TEAMS, MY_USER_ID)).toBe(mine);
  });

  it('returns null when userId is null (auth not yet resolved)', () => {
    expect(findMyTeam(TEAMS, null)).toBeNull();
  });

  it('returns null when userId is undefined', () => {
    expect(findMyTeam(TEAMS, undefined)).toBeNull();
  });

  it('returns null when no team in the season belongs to the user', () => {
    expect(findMyTeam(TEAMS, 999)).toBeNull();
  });

  it('returns null for an empty team list', () => {
    expect(findMyTeam([], MY_USER_ID)).toBeNull();
  });

  it('does not match a team with a null userId against a null userId', () => {
    expect(findMyTeam([makeTeam(7, 'Unclaimed', null)], null)).toBeNull();
  });
});

describe('findNextOpponentTeam', () => {
  it('returns the opponent team as it appears on the match', () => {
    const weeks = [
      makeWeek(1, [makeMatch(10, [mine, bronzong], { winningTeamId: 1, losingTeamId: 4 })]),
      makeWeek(2, [makeMatch(11, [mine, zapdos])]),
    ];

    expect(findNextOpponentTeam(weeks, mine.id)).toBe(zapdos);
  });

  it('returns null when every match of mine has a result', () => {
    const weeks = [
      makeWeek(1, [makeMatch(10, [mine, bronzong], { winningTeamId: 1, losingTeamId: 4 })]),
    ];

    expect(findNextOpponentTeam(weeks, mine.id)).toBeNull();
  });

  it('returns null when my unplayed match lists only my own team', () => {
    expect(findNextOpponentTeam([makeWeek(1, [makeMatch(10, [mine])])], mine.id)).toBeNull();
  });

  it('skips a week with no matches and a match with no teams without throwing', () => {
    const weeks = [
      makeWeek(1, undefined),
      makeWeek(2, [makeMatch(11, undefined)]),
      makeWeek(3, [makeMatch(12, [mine, cresselia])]),
    ];

    expect(findNextOpponentTeam(weeks, mine.id)).toBe(cresselia);
  });
});

describe('findNextOpponentTeamId', () => {
  it('returns the opponent in the lowest-weekNumber unplayed match', () => {
    const weeks = [
      makeWeek(1, [makeMatch(10, [mine, bronzong], { winningTeamId: 1, losingTeamId: 4 })]),
      makeWeek(2, [makeMatch(11, [mine, cresselia], { winningTeamId: 5, losingTeamId: 1 })]),
      makeWeek(3, [makeMatch(12, [mine, zapdos])]),
      makeWeek(4, [makeMatch(13, [mine, dragonite])]),
    ];

    expect(findNextOpponentTeamId(weeks, mine.id)).toBe(zapdos.id);
  });

  it('ignores matches that do not involve my team', () => {
    const weeks = [
      makeWeek(1, [makeMatch(10, [bronzong, cresselia])]),
      makeWeek(2, [makeMatch(11, [mine, zapdos])]),
    ];

    expect(findNextOpponentTeamId(weeks, mine.id)).toBe(zapdos.id);
  });

  it('returns null when every match of mine has a result', () => {
    const weeks = [
      makeWeek(1, [makeMatch(10, [mine, bronzong], { winningTeamId: 1, losingTeamId: 4 })]),
      makeWeek(2, [makeMatch(11, [mine, cresselia], { winningTeamId: 5, losingTeamId: 1 })]),
    ];

    expect(findNextOpponentTeamId(weeks, mine.id)).toBeNull();
  });

  it('returns null for an empty week list', () => {
    expect(findNextOpponentTeamId([], mine.id)).toBeNull();
  });

  it('picks the lowest weekNumber even when weeks arrive out of order', () => {
    const weeks = [
      makeWeek(3, [makeMatch(12, [mine, dragonite])]),
      makeWeek(1, [makeMatch(10, [mine, zapdos])]),
      makeWeek(2, [makeMatch(11, [mine, bronzong])]),
    ];

    expect(findNextOpponentTeamId(weeks, mine.id)).toBe(zapdos.id);
  });

  it('picks the first-encountered match when two unplayed matches tie on weekNumber', () => {
    const weeks = [makeWeek(1, [makeMatch(10, [mine, zapdos]), makeMatch(11, [mine, bronzong])])];

    expect(findNextOpponentTeamId(weeks, mine.id)).toBe(zapdos.id);
  });

  it('skips a week with no matches and a match with no teams without throwing', () => {
    const weeks = [
      makeWeek(1, undefined),
      makeWeek(2, [makeMatch(11, undefined)]),
      makeWeek(3, [makeMatch(12, [mine, cresselia])]),
    ];

    expect(findNextOpponentTeamId(weeks, mine.id)).toBe(cresselia.id);
  });

  it('returns null when my unplayed match lists only my own team', () => {
    const weeks = [makeWeek(1, [makeMatch(10, [mine])])];

    expect(findNextOpponentTeamId(weeks, mine.id)).toBeNull();
  });
});

describe('buildTeamSelectorGroups', () => {
  const weeks = [
    makeWeek(1, [makeMatch(10, [mine, bronzong], { winningTeamId: 1, losingTeamId: 4 })]),
    makeWeek(2, [makeMatch(11, [mine, cresselia], { winningTeamId: 5, losingTeamId: 1 })]),
    makeWeek(3, [makeMatch(12, [mine, zapdos])]),
  ];

  it('pins my team and my next opponent, and sorts the rest alphabetically', () => {
    const groups = buildTeamSelectorGroups(TEAMS, MY_USER_ID, weeks);

    expect(groups.myTeam).toBe(mine);
    expect(groups.opponent).toBe(zapdos);
    expect(groups.rest.map((t) => t.name)).toEqual([
      'Bronzong Brigade',
      'Cresselia Crew',
      'Dragonite Dynasty',
      'Empoleon Empire',
    ]);
  });

  it('emits every team exactly once across the three groups', () => {
    const groups = buildTeamSelectorGroups(TEAMS, MY_USER_ID, weeks);

    const ids = [
      ...(groups.myTeam ? [groups.myTeam.id] : []),
      ...(groups.opponent ? [groups.opponent.id] : []),
      ...groups.rest.map((t) => t.id),
    ];

    expect(ids).toHaveLength(TEAMS.length);
    expect(new Set(ids).size).toBe(TEAMS.length);
  });

  it('pins nothing and sorts everything when userId is null', () => {
    const groups = buildTeamSelectorGroups(TEAMS, null, weeks);

    expect(groups.myTeam).toBeNull();
    expect(groups.opponent).toBeNull();
    expect(groups.rest.map((t) => t.name)).toEqual([
      'Alakazam Alliance',
      'Bronzong Brigade',
      'Cresselia Crew',
      'Dragonite Dynasty',
      'Empoleon Empire',
      'Zapdos Zealots',
    ]);
  });

  it('pins nothing and sorts everything when the user owns no team in the season', () => {
    const groups = buildTeamSelectorGroups(TEAMS, 999, weeks);

    expect(groups.myTeam).toBeNull();
    expect(groups.opponent).toBeNull();
    expect(groups.rest).toHaveLength(TEAMS.length);
  });

  it('pins my team only when there are no weeks yet', () => {
    const groups = buildTeamSelectorGroups(TEAMS, MY_USER_ID, []);

    expect(groups.myTeam).toBe(mine);
    expect(groups.opponent).toBeNull();
    expect(groups.rest).toHaveLength(TEAMS.length - 1);
    expect(groups.rest).not.toContain(mine);
  });

  it('does not fall back to a played opponent', () => {
    const played = [
      makeWeek(1, [makeMatch(10, [mine, bronzong], { winningTeamId: 1, losingTeamId: 4 })]),
    ];
    const groups = buildTeamSelectorGroups(TEAMS, MY_USER_ID, played);

    expect(groups.opponent).toBeNull();
    expect(groups.rest).toContain(bronzong);
  });

  it('sorts by localeCompare, so case does not dominate', () => {
    const groups = buildTeamSelectorGroups([makeTeam(1, 'beta'), makeTeam(2, 'Alpha')], null, []);

    expect(groups.rest.map((t) => t.name)).toEqual(['Alpha', 'beta']);
  });

  it('returns empty groups for an empty team list rather than throwing', () => {
    const groups = buildTeamSelectorGroups([], MY_USER_ID, weeks);

    expect(groups).toEqual({ myTeam: null, opponent: null, rest: [] });
  });

  it('does not mutate the teams array it is given', () => {
    const input = [...TEAMS];
    buildTeamSelectorGroups(input, MY_USER_ID, weeks);

    expect(input).toEqual(TEAMS);
  });

  it('omits an opponent id that is not among the season teams', () => {
    const ghost = makeTeam(99, 'Ghost Team');
    const weeksVsGhost = [makeWeek(1, [makeMatch(10, [mine, ghost])])];
    const groups = buildTeamSelectorGroups(TEAMS, MY_USER_ID, weeksVsGhost);

    expect(groups.opponent).toBeNull();
    expect(groups.rest).toHaveLength(TEAMS.length - 1);
  });
});
