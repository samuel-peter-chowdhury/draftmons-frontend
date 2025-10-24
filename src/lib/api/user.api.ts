import { Api, buildUrl, buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { UserInputDto, PaginatedResponse } from '@/types';

/**
 * User API - handles all /api/user endpoints
 */
export const UserApi = {
  /**
   * GET /api/user?nameLike=john&page=1&pageSize=10&sortBy=lastName&sortOrder=ASC
   * Search users by name with pagination
   */
  search: (params: {
    nameLike: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) => {
    const url = buildUrlWithQuery(BASE_ENDPOINTS.USER_BASE, [], {
      ...params,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
    });
    return Api.get<PaginatedResponse<UserInputDto>>(url);
  },

  /**
   * GET /api/user/:id
   * Get a single user by ID
   */
  getById: (id: number) => {
    const url = buildUrl(BASE_ENDPOINTS.USER_BASE, id);
    return Api.get<UserInputDto>(url);
  },

  /**
   * GET /api/user
   * Get all users with optional pagination
   */
  getAll: (params?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) => {
    const url = params ? buildUrlWithQuery(BASE_ENDPOINTS.USER_BASE, [], params) : BASE_ENDPOINTS.USER_BASE;
    return Api.get<PaginatedResponse<UserInputDto>>(url);
  },
};
