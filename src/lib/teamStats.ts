import type {
  GameInput,
  GameStatInput,
  MatchInput,
  PokemonInput,
  TeamInput,
  WeekInput,
} from '@/types';

export interface TeamRecord {
  matchWins: number;
  matchLosses: number;
  matchesPlayed: number;
  /** `null` rather than 0 when nothing has been played, so callers can render an em dash. */
  matchWinPct: number | null;
  gameWins: number;
  gameLosses: number;
  gamesPlayed: number;
  gameWinPct: number | null;
  differential: number;
}

/**
 * Display helpers for a `TeamRecord`. They live here rather than in each page so
 * the team header and `rank/team` cannot drift apart — the two are required to
 * agree on screen.
 */
export function formatWinPct(pct: number | null): string {
  return pct === null ? '—' : `${(pct * 100).toFixed(1)}%`;
}

export function formatDifferential(differential: number): string {
  return differential > 0 ? `+${differential}` : String(differential);
}

/**
 * Win-loss record for one team, derived entirely from the relations a
 * `full=true` team fetch already hydrates. Missing relations (a non-`full`
 * fetch) read as zeros rather than throwing.
 */
export function computeTeamRecord(team: TeamInput): TeamRecord {
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

export interface PokemonStatRow {
  seasonPokemonId: number;
  pokemon: PokemonInput;
  gamesPlayed: number;
  directKills: number;
  indirectKills: number;
  totalKills: number;
  totalDeaths: number;
  kda: number;
  killsPerGame: number;
}

/** Same tiebreak chain as `compareRows` in `lib/pokemonStats.ts`, so the two leaderboards agree. */
function compareStatRows(a: PokemonStatRow, b: PokemonStatRow): number {
  return (
    b.totalKills - a.totalKills ||
    b.kda - a.kda ||
    b.killsPerGame - a.killsPerGame ||
    b.gamesPlayed - a.gamesPlayed
  );
}

/**
 * Per-Pokemon performance for one team's roster.
 *
 * `roster` is the team's mons in a shape both call sites can produce.
 * `gameStats` is a flat pool, grouped here by `seasonPokemonId`.
 *
 * `teamGameIds` restricts which stats count, and is the whole reason this
 * function exists: a `SeasonPokemon`'s `gameStats` are season-wide, so a mon
 * acquired mid-season arrives carrying the kills it earned for its previous
 * team. Pass `null` only when the pool is already scoped to the team's games.
 *
 * Mons with no qualifying stats are omitted entirely rather than returned as
 * zero rows.
 */
export function computePokemonStatRows(
  roster: { seasonPokemonId: number; pokemon: PokemonInput }[],
  gameStats: GameStatInput[],
  teamGameIds: Set<number> | null,
): PokemonStatRow[] {
  const statsBySeasonPokemonId = new Map<number, GameStatInput[]>();
  for (const stat of gameStats) {
    if (teamGameIds && !teamGameIds.has(stat.gameId)) continue;
    const existing = statsBySeasonPokemonId.get(stat.seasonPokemonId);
    if (existing) {
      existing.push(stat);
    } else {
      statsBySeasonPokemonId.set(stat.seasonPokemonId, [stat]);
    }
  }

  return roster
    .flatMap(({ seasonPokemonId, pokemon }) => {
      const stats = statsBySeasonPokemonId.get(seasonPokemonId) ?? [];
      if (stats.length === 0) return [];

      const directKills = stats.reduce((sum, s) => sum + s.directKills, 0);
      const indirectKills = stats.reduce((sum, s) => sum + s.indirectKills, 0);
      const totalKills = directKills + indirectKills;
      const totalDeaths = stats.reduce((sum, s) => sum + s.deaths, 0);
      const gamesPlayed = stats.length;

      return [
        {
          seasonPokemonId,
          pokemon,
          gamesPlayed,
          directKills,
          indirectKills,
          totalKills,
          totalDeaths,
          kda: totalKills / Math.max(totalDeaths, 1),
          killsPerGame: gamesPlayed > 0 ? totalKills / gamesPlayed : 0,
        },
      ];
    })
    .sort(compareStatRows);
}

export interface TeamMatchRow {
  match: MatchInput;
  week: WeekInput;
  opponent: TeamInput | null;
  outcome: 'WIN' | 'LOSS' | 'UPCOMING';
  /** Sorted by `gameNumber` ascending. Empty for a forfeit or an unplayed match. */
  games: GameInput[];
  gameWins: number;
  gameLosses: number;
}

function resolveOutcome(match: MatchInput, teamId: number): TeamMatchRow['outcome'] {
  if (match.winningTeamId === teamId) return 'WIN';
  if (match.losingTeamId === teamId) return 'LOSS';
  return 'UPCOMING';
}

/**
 * The team's full season schedule — played, forfeited and upcoming — flattened
 * out of the season's weeks and ordered by `weekNumber` (not week name, which
 * sorts `Week 10` before `Week 2`).
 */
export function buildTeamMatchHistory(weeks: WeekInput[], teamId: number): TeamMatchRow[] {
  const rows: TeamMatchRow[] = [];

  for (const week of weeks) {
    for (const match of week.matches ?? []) {
      const teams = match.teams ?? [];
      if (!teams.some((t) => t.id === teamId)) continue;

      const games = [...(match.games ?? [])].sort(
        (a, b) => (a.gameNumber ?? 0) - (b.gameNumber ?? 0),
      );

      rows.push({
        match,
        week,
        opponent: teams.find((t) => t.id !== teamId) ?? null,
        outcome: resolveOutcome(match, teamId),
        games,
        gameWins: games.filter((g) => g.winningTeamId === teamId).length,
        gameLosses: games.filter((g) => g.losingTeamId === teamId).length,
      });
    }
  }

  return rows.sort((a, b) => a.week.weekNumber - b.week.weekNumber || a.match.id - b.match.id);
}
