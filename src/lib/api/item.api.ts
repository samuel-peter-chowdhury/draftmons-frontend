import { Api, buildUrl, buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { ItemInput, ItemOutput, PaginatedResponse } from '@/types';

/**
 * Item API - handles all /api/item endpoints
 */
export const ItemApi = {
  /**
   * GET /api/item
   * Get all items with optional pagination and sorting
   */
  getAll: (params?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    generationId?: number;
  }) => {
    const url = params
      ? buildUrlWithQuery(BASE_ENDPOINTS.ITEM_BASE, [], params)
      : BASE_ENDPOINTS.ITEM_BASE;
    return Api.get<PaginatedResponse<ItemInput>>(url);
  },

  /**
   * GET /api/item/:id
   * Get a single item by ID
   */
  getById: (id: number) => {
    const url = buildUrl(BASE_ENDPOINTS.ITEM_BASE, id);
    return Api.get<ItemInput>(url);
  },

  /**
   * POST /api/item
   * Create a new item
   */
  create: (data: ItemOutput) => {
    return Api.post<ItemInput>(BASE_ENDPOINTS.ITEM_BASE, data);
  },

  /**
   * PUT /api/item/:id
   * Update an existing item
   */
  update: (id: number, data: Partial<ItemOutput>) => {
    const url = buildUrl(BASE_ENDPOINTS.ITEM_BASE, id);
    return Api.put<ItemInput>(url, data);
  },

  /**
   * DELETE /api/item/:id
   * Delete an item
   */
  delete: (id: number) => {
    const url = buildUrl(BASE_ENDPOINTS.ITEM_BASE, id);
    return Api.delete<void>(url);
  },
};
