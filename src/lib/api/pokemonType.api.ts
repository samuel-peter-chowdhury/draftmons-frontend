import { Api, buildUrl, buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { PokemonTypeInput, PaginatedResponse } from '@/types';

/**
 * PokemonType API - handles all /api/pokemon-type endpoints
 */
export const PokemonTypeApi = {
  /**
   * GET /api/pokemon-type
   * Get all pokemon types with optional pagination
   */
  getAll: (params?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) => {
    const url = params
      ? buildUrlWithQuery(BASE_ENDPOINTS.POKEMON_TYPE_BASE, [], params)
      : BASE_ENDPOINTS.POKEMON_TYPE_BASE;
    return Api.get<PaginatedResponse<PokemonTypeInput>>(url);
  },

  /**
   * GET /api/pokemon-type/:id
   * Get a single pokemon type by ID
   */
  getById: (id: number) => {
    const url = buildUrl(BASE_ENDPOINTS.POKEMON_TYPE_BASE, id);
    return Api.get<PokemonTypeInput>(url);
  },
};
