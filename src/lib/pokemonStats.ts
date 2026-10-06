import type { SeasonPokemonInput, SeasonPokemonTeamInput, TeamInput } from '@/types';

export interface PokemonRankRow {
  seasonPokemon: SeasonPokemonInput;
  gamesPlayed: number;
  totalKills: number;
  totalDeaths: number;
  kda: number;
  avgKillsPerGame: number;
  team: TeamInput | null;
  /** 1-based position in the default `compareRows` ranking, within this row's
   *  own table. Frozen at compute time so the `#` column survives a re-sort. */
  rank: number;
}

/** The seven clickable data columns on the season Pokemon rankings table. */
export type RankSortColumn =
  | 'name'
  | 'team'
  | 'gamesPlayed'
  | 'totalKills'
  | 'totalDeaths'
  | 'kda'
  | 'avgKillsPerGame';

export interface PokemonRankSplit {
  main: PokemonRankRow[];
  limited: PokemonRankRow[];
  threshold: number;
}

function mostRecentTeamEntry(
  entries: SeasonPokemonTeamInput[],
): SeasonPokemonTeamInput | null {
  if (entries.length === 0) return null;
  return entries.reduce((latest, entry) => {
    if (entry.createdAt !== latest.createdAt) {
      return entry.createdAt > latest.createdAt ? entry : latest;
    }
    return entry.id > latest.id ? entry : latest;
  });
}

/**
 * A row before it has been ranked. `rank` is a function of the row's position
 * in the sorted array, which `toRow` runs too early to know, so it is stamped
 * on afterwards by `withRanks`.
 */
type UnrankedRow = Omit<PokemonRankRow, 'rank'>;

function toRow(sp: SeasonPokemonInput, teamsById: Map<number, TeamInput>): UnrankedRow {
  const gameStats = sp.gameStats ?? [];
  const gamesPlayed = gameStats.length;
  const totalKills = gameStats.reduce((sum, gs) => sum + gs.directKills + gs.indirectKills, 0);
  const totalDeaths = gameStats.reduce((sum, gs) => sum + gs.deaths, 0);
  const latestTeamEntry = mostRecentTeamEntry(sp.seasonPokemonTeams ?? []);

  return {
    seasonPokemon: sp,
    gamesPlayed,
    totalKills,
    totalDeaths,
    kda: totalKills / Math.max(totalDeaths, 1),
    avgKillsPerGame: gamesPlayed > 0 ? totalKills / gamesPlayed : 0,
    team: latestTeamEntry ? teamsById.get(latestTeamEntry.teamId) ?? null : null,
  };
}

/**
 * The default ranking: total kills, then KDA, then average kills, then games
 * played — all descending. Also serves as the tiebreak for every column in
 * `sortPokemonRankRows`, which keeps the ranking logic in one place.
 */
function compareRows(a: UnrankedRow, b: UnrankedRow): number {
  return (
    b.totalKills - a.totalKills ||
    b.kda - a.kda ||
    b.avgKillsPerGame - a.avgKillsPerGame ||
    b.gamesPlayed - a.gamesPlayed
  );
}

/** Freezes each row's 1-based position in the ranking it was just sorted into. */
function withRanks(rows: UnrankedRow[]): PokemonRankRow[] {
  return rows.map((row, i) => ({ ...row, rank: i + 1 }));
}

export function computePokemonRanks(
  seasonPokemon: SeasonPokemonInput[],
  teamsById: Map<number, TeamInput>,
): PokemonRankSplit {
  const rows = seasonPokemon
    .map((sp) => toRow(sp, teamsById))
    .filter((row) => row.gamesPlayed > 0);

  const maxGamesPlayed = rows.reduce((max, row) => Math.max(max, row.gamesPlayed), 0);
  const threshold = Math.min(2, maxGamesPlayed);

  // Numbering is per table: `main` runs 1..n and `limited` restarts at 1, which
  // is what each table's own `index + 1` produced before ranks were stamped.
  return {
    main: withRanks(rows.filter((row) => row.gamesPlayed >= threshold).sort(compareRows)),
    limited: withRanks(
      rows.filter((row) => row.gamesPlayed >= 1 && row.gamesPlayed < threshold).sort(compareRows),
    ),
    threshold,
  };
}

/**
 * Sorts a ranking table by one column in one direction, without mutating the
 * input — `main` and `limited` come straight out of a `useMemo` and are
 * re-sorted on every header click.
 *
 * `team` is the only nullable column: a teamless row is treated as a fallback
 * tier below every real team name, so it sorts to the bottom in *both*
 * directions rather than flipping to the top on ASC. Ties always fall through
 * to `compareRows`, which stays descending regardless of `sortOrder` — that is
 * what makes the initial `('totalKills', 'DESC')` state reproduce the default
 * ranking exactly, and keeps this module's two sorts agreeing on the ranking.
 */
export function sortPokemonRankRows(
  rows: PokemonRankRow[],
  sortBy: RankSortColumn,
  sortOrder: 'ASC' | 'DESC',
): PokemonRankRow[] {
  const direction = sortOrder === 'ASC' ? 1 : -1;

  return [...rows].sort((a, b) => {
    if (sortBy === 'name') {
      const byName = a.seasonPokemon.pokemon!.name.localeCompare(b.seasonPokemon.pokemon!.name);
      if (byName !== 0) return byName * direction;
    } else if (sortBy === 'team') {
      if (a.team === null && b.team !== null) return 1;
      if (a.team !== null && b.team === null) return -1;
      if (a.team !== null && b.team !== null) {
        const byTeam = a.team.name.localeCompare(b.team.name);
        if (byTeam !== 0) return byTeam * direction;
      }
    } else {
      const diff = a[sortBy] - b[sortBy];
      if (diff !== 0) return diff * direction;
    }
    return compareRows(a, b);
  });
}
