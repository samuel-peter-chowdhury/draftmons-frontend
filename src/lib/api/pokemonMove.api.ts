import { Api, buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { PokemonMoveInput, PaginatedResponse } from '@/types';

export interface PokemonMoveFilterParams {
  pokemonId?: number;
  generationId?: number;
  full?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * PokemonMove API - handles all /api/pokemon-move endpoints
 */
export const PokemonMoveApi = {
  /**
   * GET /api/pokemon-move
   * Get pokemon moves with filtering
   */
  getAll: (params: PokemonMoveFilterParams = {}) => {
    const queryParams: Record<string, any> = { ...params };
    const url = buildUrlWithQuery(BASE_ENDPOINTS.POKEMON_MOVE_BASE, [], queryParams);
    return Api.get<PaginatedResponse<PokemonMoveInput>>(url);
  },
};
