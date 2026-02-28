import { Api, buildUrl, buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { TeamBuildInput, TeamBuildOutput, PaginatedResponse } from '@/types';

/**
 * TeamBuild API - handles all /api/team-build endpoints
 */
export const TeamBuildApi = {
  /**
   * GET /api/team-build
   * Get all team builds with optional pagination, sorting, and filtering
   */
  getAll: (params?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    userId?: number;
    seasonId?: number;
    generationId?: number;
    full?: boolean;
  }) => {
    const url = params
      ? buildUrlWithQuery(BASE_ENDPOINTS.TEAM_BUILD_BASE, [], params)
      : BASE_ENDPOINTS.TEAM_BUILD_BASE;
    return Api.get<PaginatedResponse<TeamBuildInput>>(url);
  },

  /**
   * GET /api/team-build/:id
   * Get a single team build by ID
   * @param id - TeamBuild ID
   * @param full - If true, includes full nested data (user, season, generation, teamBuildSets)
   */
  getById: (id: number, full?: boolean) => {
    const url = buildUrlWithQuery(BASE_ENDPOINTS.TEAM_BUILD_BASE, [id], full ? { full: true } : {});
    return Api.get<TeamBuildInput>(url);
  },

  /**
   * POST /api/team-build
   * Create a new team build
   */
  create: (data: TeamBuildOutput) => {
    return Api.post<TeamBuildInput>(BASE_ENDPOINTS.TEAM_BUILD_BASE, data);
  },

  /**
   * PUT /api/team-build/:id
   * Update an existing team build
   */
  update: (id: number, data: Partial<TeamBuildOutput>) => {
    const url = buildUrl(BASE_ENDPOINTS.TEAM_BUILD_BASE, id);
    return Api.put<TeamBuildInput>(url, data);
  },

  /**
   * DELETE /api/team-build/:id
   * Delete a team build
   */
  delete: (id: number) => {
    const url = buildUrl(BASE_ENDPOINTS.TEAM_BUILD_BASE, id);
    return Api.delete<void>(url);
  },
};
