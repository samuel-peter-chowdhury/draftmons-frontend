import { Api, buildUrl, buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { PokemonInput, PaginatedResponse } from '@/types';

export interface PokemonFilterParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  nameLike?: string;
  minHp?: number;
  maxHp?: number;
  minAttack?: number;
  maxAttack?: number;
  minDefense?: number;
  maxDefense?: number;
  minSpecialAttack?: number;
  maxSpecialAttack?: number;
  minSpecialDefense?: number;
  maxSpecialDefense?: number;
  minSpeed?: number;
  maxSpeed?: number;
  minBaseStatTotal?: number;
  maxBaseStatTotal?: number;
  abilityIds?: number[];
  pokemonTypeIds?: number[];
}

/**
 * Pokemon API - handles all /api/pokemon endpoints
 */
export const PokemonApi = {
  /**
   * GET /api/pokemon with complex filtering
   * Get paginated and filtered list of pokemon
   */
  getAll: (params: PokemonFilterParams = {}) => {
    // Convert arrays to comma-separated strings for query params
    const queryParams: Record<string, any> = { ...params };
    if (params.abilityIds) {
      queryParams.abilityIds = params.abilityIds.join(',');
    }
    if (params.pokemonTypeIds) {
      queryParams.pokemonTypeIds = params.pokemonTypeIds.join(',');
    }

    const url = buildUrlWithQuery(BASE_ENDPOINTS.POKEMON_BASE, [], queryParams);
    return Api.get<PaginatedResponse<PokemonInput>>(url);
  },

  /**
   * GET /api/pokemon/:id
   * Get a single pokemon by ID
   */
  getById: (id: number) => {
    const url = buildUrl(BASE_ENDPOINTS.POKEMON_BASE, id);
    return Api.get<PokemonInput>(url);
  },
};
