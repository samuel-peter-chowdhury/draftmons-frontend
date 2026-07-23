import { useMemo } from 'react';
import { useApiSWR } from '@/hooks/useApiSWR';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { calculateSpeedTiers } from '@/lib/pokemon';
import type {
  PaginatedResponse,
  SeasonPokemonTeamInput,
  TeamInput,
  TeamBuildInput,
  GameStatInput,
  PokemonInput,
} from '@/types';
import {
  ROSTER_PAGE_SIZE,
  GAME_STATS_PAGE_SIZE,
  extractPaginatedData,
} from '@/components/comparison/constants';
import type { SpeedTierPokemon, TypeEffPokemon } from '@/components/comparison/constants';

export type ComparisonSource =
  | { type: 'team'; leagueId: number; teamId: number }
  | { type: 'teamBuild'; teamBuildId: number };

function toTypeEffPokemon(pokemon: PokemonInput[]): TypeEffPokemon[] {
  return pokemon.map((pkmn) => {
    const effectivenessMap = new Map<string, number>();
    if (pkmn.typeEffectiveness) {
      for (const te of pkmn.typeEffectiveness) {
        if (te.pokemonType?.name) {
          effectivenessMap.set(te.pokemonType.name.toLowerCase(), te.value);
        }
      }
    }
    return { pokemon: pkmn, effectivenessMap };
  });
}

/**
 * Loads and normalizes one side of a comparison view — either a drafted `Team`
 * (with its roster, full team data and game stats) or a `TeamBuild`. Both
 * produce the same normalized shape consumed by the shared comparison
 * components. All fetch hooks run unconditionally (with null URLs on the
 * inactive branch) so the hook is order-stable across source types.
 */
export function useComparisonSide(source: ComparisonSource | null) {
  const teamSource = source?.type === 'team' ? source : null;
  const buildSource = source?.type === 'teamBuild' ? source : null;
  const isBuild = source?.type === 'teamBuild';

  const teamId = teamSource?.teamId ?? null;
  const leagueId = teamSource?.leagueId ?? null;
  const teamBuildId = buildSource?.teamBuildId ?? null;

  // ---- Team branch fetches ----
  const rosterUrl = teamId
    ? buildUrlWithQuery(BASE_ENDPOINTS.SEASON_POKEMON_TEAM_BASE, [], {
        teamId,
        full: true,
        pageSize: ROSTER_PAGE_SIZE,
      })
    : null;
  const {
    data: rosterData,
    loading: rosterLoadingRaw,
    error: rosterErrorRaw,
  } = useApiSWR<PaginatedResponse<SeasonPokemonTeamInput>>(rosterUrl);

  const fullUrl =
    teamId && leagueId
      ? buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'team', teamId], { full: true })
      : null;
  const {
    data: teamFull,
    loading: fullLoadingRaw,
    error: fullErrorRaw,
  } = useApiSWR<TeamInput>(fullUrl);

  const gameIds = useMemo(() => {
    if (!teamFull) return null;
    const won = teamFull.wonGames?.map((g) => g.id) ?? [];
    const lost = teamFull.lostGames?.map((g) => g.id) ?? [];
    const ids = [...won, ...lost];
    return ids.length > 0 ? ids : null;
  }, [teamFull]);

  const statsUrl =
    gameIds && leagueId
      ? buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'game-stat'], {
          gameIds,
          pageSize: GAME_STATS_PAGE_SIZE,
        })
      : null;
  const {
    data: statsRaw,
    loading: statsLoadingRaw,
    error: statsErrorRaw,
  } = useApiSWR<PaginatedResponse<GameStatInput>>(statsUrl);

  const teamGameStats = useMemo<GameStatInput[]>(() => extractPaginatedData(statsRaw), [statsRaw]);

  // ---- TeamBuild branch fetch ----
  const buildUrl = teamBuildId
    ? buildUrlWithQuery(BASE_ENDPOINTS.TEAM_BUILD_BASE, [teamBuildId], { full: true })
    : null;
  const {
    data: teamBuild,
    loading: buildLoading,
    error: buildError,
  } = useApiSWR<TeamBuildInput>(buildUrl);

  // ---- Normalized derivations ----
  const speedTierPokemon = useMemo<SpeedTierPokemon[]>(() => {
    if (isBuild) {
      if (!teamBuild) return [];
      return (teamBuild.teamBuildSets ?? [])
        .flatMap((s) =>
          s.pokemon ? [{ pokemon: s.pokemon, speedTiers: calculateSpeedTiers(s.pokemon.speed) }] : [],
        )
        .sort((a, b) => b.pokemon.speed - a.pokemon.speed);
    }
    if (!rosterData) return [];
    return rosterData.data
      .flatMap((spt) => {
        const pkmn = spt.seasonPokemon?.pokemon;
        if (!pkmn) return [];
        return [{ pokemon: pkmn, speedTiers: calculateSpeedTiers(pkmn.speed) }];
      })
      .sort((a, b) => b.pokemon.speed - a.pokemon.speed);
  }, [isBuild, teamBuild, rosterData]);

  const rawPokemon = useMemo(
    () => speedTierPokemon.map(({ pokemon }) => pokemon),
    [speedTierPokemon],
  );

  const typeEffPokemon = useMemo<TypeEffPokemon[]>(
    () => toTypeEffPokemon(rawPokemon),
    [rawPokemon],
  );

  const pointTotal = useMemo(() => {
    if (isBuild) {
      return (teamBuild?.teamBuildSets ?? []).reduce((sum, s) => sum + (s.pointValue ?? 0), 0);
    }
    if (!rosterData) return 0;
    return rosterData.data.reduce((sum, spt) => sum + (spt.seasonPokemon?.pointValue ?? 0), 0);
  }, [isBuild, teamBuild, rosterData]);

  const label = isBuild ? (teamBuild?.name ?? '') : (teamFull?.name ?? '');

  return {
    // Normalized outputs (shared by both source types)
    label,
    speedTierPokemon,
    typeEffPokemon,
    rawPokemon,
    pointTotal,
    // Team-specific data ([] / null for teamBuild sources)
    teamFull: isBuild ? null : (teamFull ?? null),
    rosterData: isBuild ? null : (rosterData ?? null),
    gameStats: isBuild ? [] : teamGameStats,
    // Build-specific data (null for team sources)
    teamBuild: isBuild ? (teamBuild ?? null) : null,
    // Loading / error flags (mapped so team-matchup keeps identical semantics)
    rosterLoading: isBuild ? buildLoading : rosterLoadingRaw,
    fullLoading: isBuild ? buildLoading : fullLoadingRaw,
    statsLoading: isBuild ? false : statsLoadingRaw,
    rosterError: isBuild ? buildError : rosterErrorRaw,
    fullError: isBuild ? buildError : fullErrorRaw,
    statsError: isBuild ? null : statsErrorRaw,
  };
}
