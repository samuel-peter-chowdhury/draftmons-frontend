import type { SeasonPokemonInput, SeasonPokemonTeamInput, TeamInput } from '@/types';

export interface PokemonRankRow {
  seasonPokemon: SeasonPokemonInput;
  gamesPlayed: number;
  totalKills: number;
  totalDeaths: number;
  kda: number;
  avgKillsPerGame: number;
  team: TeamInput | null;
}

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

function toRow(sp: SeasonPokemonInput, teamsById: Map<number, TeamInput>): PokemonRankRow {
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

function compareRows(a: PokemonRankRow, b: PokemonRankRow): number {
  return (
    b.totalKills - a.totalKills ||
    b.kda - a.kda ||
    b.avgKillsPerGame - a.avgKillsPerGame ||
    b.gamesPlayed - a.gamesPlayed
  );
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

  return {
    main: rows.filter((row) => row.gamesPlayed >= threshold).sort(compareRows),
    limited: rows
      .filter((row) => row.gamesPlayed >= 1 && row.gamesPlayed < threshold)
      .sort(compareRows),
    threshold,
  };
}
