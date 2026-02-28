import { Api, buildUrl, buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { NatureInput, NatureOutput, PaginatedResponse } from '@/types';

/**
 * Nature API - handles all /api/nature endpoints
 */
export const NatureApi = {
  /**
   * GET /api/nature
   * Get all natures with optional pagination and sorting
   */
  getAll: (params?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) => {
    const url = params
      ? buildUrlWithQuery(BASE_ENDPOINTS.NATURE_BASE, [], params)
      : BASE_ENDPOINTS.NATURE_BASE;
    return Api.get<PaginatedResponse<NatureInput>>(url);
  },

  /**
   * GET /api/nature/:id
   * Get a single nature by ID
   */
  getById: (id: number) => {
    const url = buildUrl(BASE_ENDPOINTS.NATURE_BASE, id);
    return Api.get<NatureInput>(url);
  },

  /**
   * POST /api/nature
   * Create a new nature
   */
  create: (data: NatureOutput) => {
    return Api.post<NatureInput>(BASE_ENDPOINTS.NATURE_BASE, data);
  },

  /**
   * PUT /api/nature/:id
   * Update an existing nature
   */
  update: (id: number, data: Partial<NatureOutput>) => {
    const url = buildUrl(BASE_ENDPOINTS.NATURE_BASE, id);
    return Api.put<NatureInput>(url, data);
  },

  /**
   * DELETE /api/nature/:id
   * Delete a nature
   */
  delete: (id: number) => {
    const url = buildUrl(BASE_ENDPOINTS.NATURE_BASE, id);
    return Api.delete<void>(url);
  },
};
