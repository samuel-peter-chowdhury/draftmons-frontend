import { Api, buildUrl, buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { AbilityInput, PaginatedResponse } from '@/types';

/**
 * Ability API - handles all /api/ability endpoints
 */
export const AbilityApi = {
  /**
   * GET /api/ability
   * Get all abilities with optional pagination
   */
  getAll: (params?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) => {
    const url = params
      ? buildUrlWithQuery(BASE_ENDPOINTS.ABILITY_BASE, [], params)
      : BASE_ENDPOINTS.ABILITY_BASE;
    return Api.get<PaginatedResponse<AbilityInput>>(url);
  },

  /**
   * GET /api/ability/:id
   * Get a single ability by ID
   */
  getById: (id: number) => {
    const url = buildUrl(BASE_ENDPOINTS.ABILITY_BASE, id);
    return Api.get<AbilityInput>(url);
  },
};
