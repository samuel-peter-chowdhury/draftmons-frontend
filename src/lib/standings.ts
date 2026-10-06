import { computeTeamRecord, type TeamRecord } from '@/lib/teamStats';
import type { TeamInput } from '@/types';
import { formatUserDisplayName } from './utils';

export interface StandingsRow {
  team: TeamInput;
  matchWins: number;
  matchLosses: number;
  matchesPlayed: number;
  matchWinPct: number | null;
  gameWins: number;
  gameLosses: number;
  gamesPlayed: number;
  gameWinPct: number | null;
  differential: number;
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
  const matchWins = team.wonMatches?.length ?? 0;
  const matchLosses = team.lostMatches?.length ?? 0;
  const matchesPlayed = matchWins + matchLosses;
  const gameWins = team.wonGames?.length ?? 0;
  const gameLosses = team.lostGames?.length ?? 0;
  const gamesPlayed = gameWins + gameLosses;
  const differential =
    (team.wonGames ?? []).reduce((sum, g) => sum + g.differential, 0) -
    (team.lostGames ?? []).reduce((sum, g) => sum + g.differential, 0);

  return {
    team,
    matchWins,
    matchLosses,
    matchesPlayed,
    matchWinPct: matchesPlayed > 0 ? matchWins / matchesPlayed : null,
    gameWins,
    gameLosses,
    gamesPlayed,
    gameWinPct: gamesPlayed > 0 ? gameWins / gamesPlayed : null,
    differential,
  };
}

export interface StandingsRow extends TeamRecord {
  team: TeamInput;
}

function toRow(team: TeamInput): StandingsRow {
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
