import { computeTeamRecord, type TeamRecord } from '@/lib/teamStats';
import type { GameInput, MatchInput, MatchResultSource, TeamInput } from '@/types';

export interface StandingsRow extends TeamRecord {
  team: TeamInput;
}

function toRow(team: TeamInput): StandingsRow {
  return { team, ...computeTeamRecord(team) };
}

function compareRows(a: StandingsRow, b: StandingsRow): number {
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
  return teams.map(toRow).sort(compareRows);
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
