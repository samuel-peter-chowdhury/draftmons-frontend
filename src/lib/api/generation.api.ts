import { Api, buildUrl, buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { GenerationOutputDto, PaginatedResponse } from '@/types';

/**
 * Generation API - handles all /api/generation endpoints
 */
export const GenerationApi = {
  /**
   * GET /api/generation
   * Get all generations
   */
  getAll: (params?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) => {
    const url = params
      ? buildUrlWithQuery(BASE_ENDPOINTS.GENERATION_BASE, [], params)
      : BASE_ENDPOINTS.GENERATION_BASE;
    return Api.get<PaginatedResponse<GenerationOutputDto>>(url);
  },

  /**
   * GET /api/generation/:id
   * Get a single generation by ID
   */
  getById: (id: number) => {
    const url = buildUrl(BASE_ENDPOINTS.GENERATION_BASE, id);
    return Api.get<GenerationOutputDto>(url);
  },
};
