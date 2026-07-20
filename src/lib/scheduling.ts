/**
 * Pure client-side round-robin schedule generator for the season admin
 * schedule creator. No network calls — see specs/season-admin-schedule-creator.md
 * for the algorithm this implements.
 */

export interface SchedulingTeamInput {
  teamId: number;
  skillLevel: number;
}

export interface SchedulePairing {
  teamAId: number;
  teamBId: number;
}

export interface GeneratedWeek {
  name: string;
  pairings: SchedulePairing[];
  byeTeamId: number | null;
}

export interface ScheduleBalanceRow {
  teamId: number;
  skillLevel: number;
  opponentsCount: number;
  averageOpponentSkill: number | null;
}

export interface GeneratedSchedule {
  weeks: GeneratedWeek[];
  balance: ScheduleBalanceRow[];
}

/** Sentinel used internally to represent the phantom "bye" team for odd team counts. */
const BYE = Symbol('bye');
type SlotId = number | typeof BYE;

interface RoundData {
  pairings: SchedulePairing[];
  byeTeamId: number | null;
}

export function getMaxFeasibleWeeks(teamCount: number): number {
  return Math.max(0, teamCount - 1);
}

/**
 * Returns a human-readable infeasibility message, or null if numberOfWeeks
 * is achievable without repeating a matchup.
 */
export function getFeasibilityError(teamCount: number, numberOfWeeks: number): string | null {
  if (teamCount < 2) {
    return 'At least 2 teams are required to generate a schedule.';
  }
  const maxWeeks = getMaxFeasibleWeeks(teamCount);
  if (numberOfWeeks > maxWeeks) {
    return `${teamCount} teams allow${teamCount === 1 ? 's' : ''} at most ${maxWeeks} week${
      maxWeeks === 1 ? '' : 's'
    } without repeating a matchup; this season is configured for ${numberOfWeeks}.`;
  }
  return null;
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Standard circle-method round robin. For n teams (n even after padding with
 * a phantom bye slot when the real count is odd), produces n-1 rounds, each
 * a perfect matching, with every unique pair appearing exactly once.
 */
function buildRoundsViaCircleMethod(teamIds: number[]): RoundData[] {
  const isOdd = teamIds.length % 2 !== 0;
  const slots: SlotId[] = isOdd ? [...teamIds, BYE] : [...teamIds];
  const n = slots.length;
  const rounds: RoundData[] = [];
  const arr = [...slots];

  for (let round = 0; round < n - 1; round++) {
    const pairings: SchedulePairing[] = [];
    let byeTeamId: number | null = null;

    for (let i = 0; i < n / 2; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a === BYE) {
        byeTeamId = b as number;
      } else if (b === BYE) {
        byeTeamId = a as number;
      } else {
        pairings.push({ teamAId: a as number, teamBId: b as number });
      }
    }

    rounds.push({ pairings, byeTeamId });

    // Rotate: keep slot 0 fixed, rotate the rest by one position.
    const last = arr[n - 1];
    for (let i = n - 1; i > 1; i--) {
      arr[i] = arr[i - 1];
    }
    arr[1] = last;
  }

  return rounds;
}

interface SoSEntry {
  opponents: number[];
  sos: number;
}

function computeSoS(
  teams: SchedulingTeamInput[],
  rounds: RoundData[],
  selectedIndices: ReadonlySet<number>,
): Map<number, SoSEntry> {
  const skillById = new Map(teams.map((t) => [t.teamId, t.skillLevel]));
  const opponentsByTeam = new Map<number, number[]>(teams.map((t) => [t.teamId, []]));

  for (const idx of selectedIndices) {
    for (const pairing of rounds[idx].pairings) {
      opponentsByTeam.get(pairing.teamAId)?.push(skillById.get(pairing.teamBId) ?? 0);
      opponentsByTeam.get(pairing.teamBId)?.push(skillById.get(pairing.teamAId) ?? 0);
    }
  }

  const result = new Map<number, SoSEntry>();
  for (const [teamId, opponents] of opponentsByTeam) {
    const sos =
      opponents.length > 0 ? opponents.reduce((a, b) => a + b, 0) / opponents.length : 0;
    result.set(teamId, { opponents, sos });
  }
  return result;
}

function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
}

function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n === 0) return 0;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  const denom = Math.sqrt(denomX * denomY);
  return denom === 0 ? 0 : numerator / denom;
}

interface SubsetScore {
  variance: number;
  correlation: number;
}

function scoreSubset(
  teams: SchedulingTeamInput[],
  rounds: RoundData[],
  selectedIndices: ReadonlySet<number>,
): SubsetScore {
  const sosByTeam = computeSoS(teams, rounds, selectedIndices);
  const sosValues = teams.map((t) => sosByTeam.get(t.teamId)?.sos ?? 0);
  const skillValues = teams.map((t) => t.skillLevel);
  return {
    variance: variance(sosValues),
    correlation: pearsonCorrelation(skillValues, sosValues),
  };
}

const VARIANCE_EPSILON = 1e-6;
const MAX_LOCAL_SEARCH_ITERATIONS = 300;

/**
 * Picks numberOfWeeks rounds out of the full round-robin, minimizing the
 * variance of each team's strength-of-schedule via a bounded local search
 * (swap one included round for one excluded round while it helps).
 */
function selectBalancedRounds(
  teams: SchedulingTeamInput[],
  rounds: RoundData[],
  numberOfWeeks: number,
): number[] {
  const allIndices = rounds.map((_, i) => i);
  let selected = new Set(shuffle(allIndices).slice(0, numberOfWeeks));
  let score = scoreSubset(teams, rounds, selected);

  let iterations = 0;
  let improved = true;

  while (improved && iterations < MAX_LOCAL_SEARCH_ITERATIONS) {
    improved = false;
    for (const includedIdx of [...selected]) {
      for (const excludedIdx of allIndices) {
        if (selected.has(excludedIdx)) continue;
        iterations++;
        if (iterations >= MAX_LOCAL_SEARCH_ITERATIONS) break;

        const candidate = new Set(selected);
        candidate.delete(includedIdx);
        candidate.add(excludedIdx);
        const candidateScore = scoreSubset(teams, rounds, candidate);

        const variancesClose =
          Math.abs(candidateScore.variance - score.variance) <= VARIANCE_EPSILON;
        const better =
          candidateScore.variance < score.variance - VARIANCE_EPSILON ||
          (variancesClose && candidateScore.correlation > score.correlation);

        if (better) {
          selected = candidate;
          score = candidateScore;
          improved = true;
        }
      }
      if (iterations >= MAX_LOCAL_SEARCH_ITERATIONS) break;
    }
  }

  return [...selected];
}

/**
 * Generates a skill-balanced, non-repeating schedule spanning exactly
 * numberOfWeeks weeks. Throws if infeasible — callers should check
 * getFeasibilityError first to show a friendly message instead.
 */
export function generateSchedule(
  teams: SchedulingTeamInput[],
  numberOfWeeks: number,
): GeneratedSchedule {
  const feasibilityError = getFeasibilityError(teams.length, numberOfWeeks);
  if (feasibilityError) {
    throw new Error(feasibilityError);
  }

  const shuffledTeamIds = shuffle(teams.map((t) => t.teamId));
  const rounds = buildRoundsViaCircleMethod(shuffledTeamIds);
  const selectedIndices = selectBalancedRounds(teams, rounds, numberOfWeeks).sort((a, b) => a - b);

  const weeks: GeneratedWeek[] = selectedIndices.map((idx, i) => ({
    name: `Week ${i + 1}`,
    pairings: rounds[idx].pairings,
    byeTeamId: rounds[idx].byeTeamId,
  }));

  const finalSoS = computeSoS(teams, rounds, new Set(selectedIndices));
  const balance: ScheduleBalanceRow[] = teams.map((t) => {
    const entry = finalSoS.get(t.teamId);
    return {
      teamId: t.teamId,
      skillLevel: t.skillLevel,
      opponentsCount: entry?.opponents.length ?? 0,
      averageOpponentSkill: entry && entry.opponents.length > 0 ? entry.sos : null,
    };
  });

  return { weeks, balance };
}
