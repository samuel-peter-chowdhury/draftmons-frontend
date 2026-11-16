import { computeTeamRecord, type TeamRecord } from '@/lib/teamStats';
import { formatUserDisplayName } from '@/lib/utils';
import type { GameInput, MatchInput, MatchResultSource, TeamInput } from '@/types';

export interface StandingsRow extends TeamRecord {
  team: TeamInput;
  /** Position in the default standings order, frozen so a user re-sort can't renumber it. */
  rank: number;
}

/** A row before `computeStandings` stamps its standings position onto it. */
type StandingsStats = Omit<StandingsRow, 'rank'>;

/** The user-sortable columns of the team rankings table. `#` is display-only. */
export type TeamRankSortColumn =
  | 'name'
  | 'owner'
  | 'matchRecord'
  | 'matchWinPct'
  | 'gameRecord'
  | 'gameWinPct'
  | 'differential';

function toRow(team: TeamInput): StandingsStats {
  return { team, ...computeTeamRecord(team) };
}

function compareRows(a: StandingsStats, b: StandingsStats): number {
  if (a.matchesPlayed === 0 && b.matchesPlayed === 0) {
    return a.team.name.localeCompare(b.team.name);
  }
  if (a.matchesPlayed === 0) return 1;
  if (b.matchesPlayed === 0) return -1;

  return (
    (b.matchWinPct as number) - (a.matchWinPct as number) ||
    b.matchWins - b.matchLosses - (a.matchWins - a.matchLosses) ||
    (b.gameWinPct as number) - (a.gameWinPct as number) ||
    b.gameWins - b.gameLosses - (a.gameWins - a.gameLosses) ||
    b.differential - a.differential
  );
}

export function computeStandings(teams: TeamInput[]): StandingsRow[] {
  return teams
    .map(toRow)
    .sort(compareRows)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function ownerKey(row: StandingsRow): string {
  return formatUserDisplayName(row.team.user, 'Unclaimed');
}

function compareText(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

/**
 * Rows held at the bottom in **both** sort directions, so reversing a sort never
 * floats uninformative rows to the top. A `0-0` record and a differential of `0`
 * are genuine values, so the record and differential columns pin nothing.
 */
function isPinned(row: StandingsRow, column: TeamRankSortColumn): boolean {
  switch (column) {
    case 'matchWinPct':
      return row.matchWinPct === null;
    case 'gameWinPct':
      return row.gameWinPct === null;
    case 'owner':
      return !row.team.user;
    default:
      return false;
  }
}

/**
 * Ascending comparator per column; `sortStandings` negates it for `DESC`.
 *
 * The record columns compare wins first and break ties on fewer losses rather
 * than comparing win rate — the adjacent Win% column already covers rate.
 */
function compareAscending(a: StandingsRow, b: StandingsRow, column: TeamRankSortColumn): number {
  switch (column) {
    case 'name':
      return compareText(a.team.name, b.team.name);
    case 'owner':
      return compareText(ownerKey(a), ownerKey(b));
    case 'matchRecord':
      return a.matchWins - b.matchWins || b.matchLosses - a.matchLosses;
    case 'matchWinPct':
      return (a.matchWinPct ?? 0) - (b.matchWinPct ?? 0);
    case 'gameRecord':
      return a.gameWins - b.gameWins || b.gameLosses - a.gameLosses;
    case 'gameWinPct':
      return (a.gameWinPct ?? 0) - (b.gameWinPct ?? 0);
    case 'differential':
      return a.differential - b.differential;
  }
}

/**
 * Re-sorts standings rows for the rankings table. `sortBy === null` is the
 * unsorted case and keeps the default standings order. Never mutates `rows` —
 * the page passes its memoized `computeStandings` result straight in.
 */
export function sortStandings(
  rows: StandingsRow[],
  sortBy: TeamRankSortColumn | null,
  sortOrder: 'ASC' | 'DESC',
): StandingsRow[] {
  if (sortBy === null) return [...rows];

  const direction = sortOrder === 'ASC' ? 1 : -1;

  return [...rows].sort((a, b) => {
    const aPinned = isPinned(a, sortBy);
    const bPinned = isPinned(b, sortBy);
    if (aPinned !== bPinned) return aPinned ? 1 : -1;
    // Returning 0 keeps the pinned group in its incoming order; sort is stable.
    if (aPinned) return 0;

    return direction * compareAscending(a, b, sortBy);
  });
}

/**
 * One decided match, from the subject team's point of view, ready to render as a
 * line in an expanded standings row. A view model rather than a DTO — it lives
 * here beside `StandingsRow` for the same reason, and everything it carries is
 * already present in the page's single `full: true` team request.
 */
export interface MatchSummary {
  matchId: number;
  outcome: 'W' | 'L';
  weekName: string | null;
  weekNumber: number | null;
  opponentId: number;
  /** `null` when the opponent id isn't in the lookup map — render "Unknown team". */
  opponent: TeamInput | null;
  resultSource: MatchResultSource | null;
  gameWins: number;
  gameLosses: number;
  /** `false` for a zero-game match (a forfeit) — render the score as an em dash, never `0-0`. */
  hasGames: boolean;
  /**
   * Ordered: numbered games ascending, then unnumbered ones by game id, so a
   * replay's display position is deterministic. `gameNumber` is `null` when the
   * backend never recorded one — `game.game_number` is nullable and only the
   * manual-upload flow populates it, so most games carry no number. Callers must
   * label those by position rather than printing a number the backend never gave.
   */
  replays: { gameNumber: number | null; replayLink: string }[];
}

function indexGamesByMatch(games: GameInput[]): Map<number, GameInput[]> {
  const byMatch = new Map<number, GameInput[]>();
  for (const game of games) {
    const existing = byMatch.get(game.matchId);
    if (existing) {
      existing.push(game);
    } else {
      byMatch.set(game.matchId, [game]);
    }
  }
  return byMatch;
}

/**
 * Numbered games ascending, then unnumbered ones last by game id. Game ids are
 * monotonic by insertion, so they are the only ordering signal available for the
 * majority of games, whose `gameNumber` is null.
 */
function compareGames(a: GameInput, b: GameInput): number {
  // `!= null` rather than `=== null`: GameInput types the field as optional, but
  // the API sends null, so both have to be treated as "unrecorded".
  const aNumbered = a.gameNumber != null;
  const bNumbered = b.gameNumber != null;
  if (aNumbered && bNumbered) {
    return (a.gameNumber as number) - (b.gameNumber as number) || a.id - b.id;
  }
  if (aNumbered) return -1;
  if (bNumbered) return 1;
  return a.id - b.id;
}

/** Chronological: week ascending, weekless matches last, match id as a stable tie-break. */
function compareSummaries(a: MatchSummary, b: MatchSummary): number {
  if (a.weekNumber !== b.weekNumber) {
    if (a.weekNumber === null) return 1;
    if (b.weekNumber === null) return -1;
    return a.weekNumber - b.weekNumber;
  }
  return a.matchId - b.matchId;
}

/**
 * Turns a team's `wonMatches`/`lostMatches` (plus its games, for the per-match
 * score) into an ordered list of match summaries. `teamsById` resolves opponent
 * ids locally — the nested `winningTeam`/`losingTeam` objects sit behind the
 * `match.full` group and are not in this payload.
 *
 * Only decided matches are present: `Team.matches` is not loaded by
 * `TeamController.getFullRelations()`, so scheduled-but-unplayed matches are
 * absent by design.
 */
export function buildMatchSummaries(
  team: TeamInput,
  teamsById: Map<number, TeamInput>,
): MatchSummary[] {
  // Indexed once up front rather than filtering both arrays per match.
  const wonGamesByMatch = indexGamesByMatch(team.wonGames ?? []);
  const lostGamesByMatch = indexGamesByMatch(team.lostGames ?? []);

  const toSummary = (match: MatchInput, outcome: 'W' | 'L'): MatchSummary => {
    // Derived from the ids, not from which bucket the match came out of, so a
    // malformed match can't point the opponent back at the subject team.
    const opponentId = match.winningTeamId === team.id ? match.losingTeamId : match.winningTeamId;
    const wonGames = wonGamesByMatch.get(match.id) ?? [];
    const lostGames = lostGamesByMatch.get(match.id) ?? [];

    return {
      matchId: match.id,
      outcome,
      weekName: match.week?.name ?? null,
      weekNumber: match.week?.weekNumber ?? null,
      opponentId,
      opponent: teamsById.get(opponentId) ?? null,
      resultSource: match.resultSource ?? null,
      gameWins: wonGames.length,
      gameLosses: lostGames.length,
      hasGames: wonGames.length + lostGames.length > 0,
      replays: [...wonGames, ...lostGames]
        .filter((game) => game.replayLink)
        .sort(compareGames)
        .map((game) => ({ gameNumber: game.gameNumber ?? null, replayLink: game.replayLink })),
    };
  };

  return [
    ...(team.wonMatches ?? []).map((match) => toSummary(match, 'W')),
    ...(team.lostMatches ?? []).map((match) => toSummary(match, 'L')),
  ].sort(compareSummaries);
}
