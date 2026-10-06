import type { TeamInput, WeekInput } from '@/types';

/**
 * Grouping for the team matchup page's Team A / Team B selectors: your own team and
 * your next opponent pinned above an alphabetical list of everyone else.
 *
 * `rest` never contains `myTeam` or `opponent`, so a caller can render all three
 * groups and still emit each team exactly once.
 */
export interface TeamSelectorGroups {
  myTeam: TeamInput | null;
  opponent: TeamInput | null;
  rest: TeamInput[];
}

/**
 * The season team belonging to the logged-in user. `userId` is null while
 * `useAuthStore` is still resolving, which is not a match for an unclaimed team.
 */
export function findMyTeam(
  teams: TeamInput[],
  userId: number | null | undefined,
): TeamInput | null {
  if (userId == null) return null;
  return teams.find((team) => team.userId === userId) ?? null;
}

/**
 * The other team in my lowest-`weekNumber` unplayed match, or null when I have none.
 * Deliberately no fallback to a played opponent — "who do I play next" is the only
 * question this answers.
 *
 * The team comes off the match's own `teams` array, so it carries whatever a `full`
 * week response nests. Callers that need the season's copy should resolve by id.
 */
export function findNextOpponentTeam(weeks: WeekInput[], myTeamId: number): TeamInput | null {
  const myMatches = weeks.flatMap((week) =>
    (week.matches ?? [])
      .filter((match) => (match.teams ?? []).some((team) => team.id === myTeamId))
      .map((match) => ({ match, weekNumber: week.weekNumber })),
  );

  const unplayedMatches = myMatches.filter(
    ({ match }) => !match.winningTeamId && !match.losingTeamId,
  );
  if (unplayedMatches.length === 0) return null;

  // Strict `<` keeps the first-encountered match on a weekNumber tie.
  const next = unplayedMatches.reduce((a, b) => (b.weekNumber < a.weekNumber ? b : a));
  return (next.match.teams ?? []).find((team) => team.id !== myTeamId) ?? null;
}

/** Id-only form of {@link findNextOpponentTeam}. */
export function findNextOpponentTeamId(weeks: WeekInput[], myTeamId: number): number | null {
  return findNextOpponentTeam(weeks, myTeamId)?.id ?? null;
}

export function buildTeamSelectorGroups(
  teams: TeamInput[],
  userId: number | null | undefined,
  weeks: WeekInput[],
): TeamSelectorGroups {
  const myTeam = findMyTeam(teams, userId);
  const opponentId = myTeam ? findNextOpponentTeamId(weeks, myTeam.id) : null;
  const opponent =
    opponentId === null ? null : (teams.find((team) => team.id === opponentId) ?? null);

  const pinnedIds = new Set<number>();
  if (myTeam) pinnedIds.add(myTeam.id);
  if (opponent) pinnedIds.add(opponent.id);

  const rest = teams
    .filter((team) => !pinnedIds.has(team.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { myTeam, opponent, rest };
}
