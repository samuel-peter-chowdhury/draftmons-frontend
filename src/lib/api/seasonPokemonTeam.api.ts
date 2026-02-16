import { Api, buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { SeasonPokemonTeamInput, PaginatedResponse } from '@/types';

export interface SeasonPokemonTeamFilterParams {
  seasonPokemonId?: number;
  teamId?: number;
  full?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * SeasonPokemonTeam API - handles all /api/season-pokemon-team endpoints
 */
export const SeasonPokemonTeamApi = {
  /**
   * GET /api/season-pokemon-team
   * Get season pokemon team assignments with filtering
   */
  getAll: (params: SeasonPokemonTeamFilterParams = {}) => {
    const queryParams: Record<string, any> = { ...params };
    const url = buildUrlWithQuery(BASE_ENDPOINTS.SEASON_POKEMON_TEAM_BASE, [], queryParams);
    return Api.get<PaginatedResponse<SeasonPokemonTeamInput>>(url);
  },
};
