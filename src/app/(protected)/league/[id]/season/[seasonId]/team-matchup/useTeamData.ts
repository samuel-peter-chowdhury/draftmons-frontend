import { useMemo } from 'react';
import { useFetch } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { calculateSpeedTiers } from '@/lib/pokemon';
import type {
  PaginatedResponse,
  SeasonPokemonTeamInput,
  TeamInput,
  GameStatInput,
} from '@/types';
import {
  ROSTER_PAGE_SIZE,
  GAME_STATS_PAGE_SIZE,
  extractPaginatedData,
} from './constants';
import type { SpeedTierPokemon, TypeEffPokemon } from './constants';

export function useTeamData(teamId: number | null, leagueId: number) {
  // Fetch roster
  const rosterUrl = teamId
    ? buildUrlWithQuery(BASE_ENDPOINTS.SEASON_POKEMON_TEAM_BASE, [], {
        teamId,
        full: true,
        pageSize: ROSTER_PAGE_SIZE,
      })
    : null;
  const {
    data: rosterData,
    loading: rosterLoading,
    error: rosterError,
  } = useFetch<PaginatedResponse<SeasonPokemonTeamInput>>(rosterUrl);

  // Fetch full team data (user info, matches, games)
  const fullUrl = teamId
    ? buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'team', teamId], { full: true })
    : null;
  const {
    data: teamFull,
    loading: fullLoading,
    error: fullError,
  } = useFetch<TeamInput>(fullUrl);

  // Derive game IDs → fetch game stats (dependent on full team data)
  const gameIds = useMemo(() => {
    if (!teamFull) return null;
    const won = teamFull.wonGames?.map((g) => g.id) ?? [];
    const lost = teamFull.lostGames?.map((g) => g.id) ?? [];
    const ids = [...won, ...lost];
    return ids.length > 0 ? ids : null;
  }, [teamFull]);

  const statsUrl = gameIds
    ? buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'game-stat'], {
        gameIds,
        pageSize: GAME_STATS_PAGE_SIZE,
      })
    : null;
  const {
    data: statsRaw,
    loading: statsLoading,
    error: statsError,
  } = useFetch<PaginatedResponse<GameStatInput>>(statsUrl);

  const gameStats = useMemo<GameStatInput[]>(
    () => extractPaginatedData(statsRaw),
    [statsRaw],
  );

  // Derive speed-tier pokemon (sorted by speed desc)
  const speedTierPokemon = useMemo<SpeedTierPokemon[]>(() => {
    if (!rosterData) return [];
    return rosterData.data
      .flatMap((spt) => {
        const pkmn = spt.seasonPokemon?.pokemon;
        if (!pkmn) return [];
        return [{ pokemon: pkmn, speedTiers: calculateSpeedTiers(pkmn.speed) }];
      })
      .sort((a, b) => b.pokemon.speed - a.pokemon.speed);
  }, [rosterData]);

  // Derive raw pokemon from speedTierPokemon (avoids redundant filter+map)
  const rawPokemon = useMemo(
    () => speedTierPokemon.map(({ pokemon }) => pokemon),
    [speedTierPokemon],
  );

  // Derive type-effectiveness pokemon
  const typeEffPokemon = useMemo<TypeEffPokemon[]>(() => {
    if (!rosterData) return [];
    return rosterData.data
      .flatMap((spt) => {
        const pkmn = spt.seasonPokemon?.pokemon;
        if (!pkmn) return [];
        const effectivenessMap = new Map<string, number>();
        if (pkmn.typeEffectiveness) {
          for (const te of pkmn.typeEffectiveness) {
            if (te.pokemonType?.name) {
              effectivenessMap.set(te.pokemonType.name.toLowerCase(), te.value);
            }
          }
        }
        return [{ pokemon: pkmn, effectivenessMap }];
      })
      .sort((a, b) => b.pokemon.speed - a.pokemon.speed);
  }, [rosterData]);

  return {
    speedTierPokemon,
    typeEffPokemon,
    rawPokemon,
    teamFull,
    rosterData,
    gameStats,
    rosterLoading,
    fullLoading,
    statsLoading,
    rosterError,
    fullError,
    statsError,
  };
}
