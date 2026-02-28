import { Api, buildUrl, buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { TeamBuildSetInput, TeamBuildSetOutput, PaginatedResponse } from '@/types';

/**
 * TeamBuildSet API - handles all /api/team-build-set endpoints
 */
export const TeamBuildSetApi = {
  /**
   * GET /api/team-build-set
   * Get all team build sets with optional pagination, sorting, and filtering
   */
  getAll: (params?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    teamBuildId?: number;
    pokemonId?: number;
    full?: boolean;
  }) => {
    const url = params
      ? buildUrlWithQuery(BASE_ENDPOINTS.TEAM_BUILD_SET_BASE, [], params)
      : BASE_ENDPOINTS.TEAM_BUILD_SET_BASE;
    return Api.get<PaginatedResponse<TeamBuildSetInput>>(url);
  },

  /**
   * GET /api/team-build-set/:id
   * Get a single team build set by ID
   * @param id - TeamBuildSet ID
   * @param full - If true, includes full nested data (teamBuild, pokemon, item, ability, moves, nature)
   */
  getById: (id: number, full?: boolean) => {
    const url = buildUrlWithQuery(
      BASE_ENDPOINTS.TEAM_BUILD_SET_BASE,
      [id],
      full ? { full: true } : {},
    );
    return Api.get<TeamBuildSetInput>(url);
  },

  /**
   * POST /api/team-build-set
   * Create a new team build set
   */
  create: (data: TeamBuildSetOutput) => {
    return Api.post<TeamBuildSetInput>(BASE_ENDPOINTS.TEAM_BUILD_SET_BASE, data);
  },

  /**
   * PUT /api/team-build-set/:id
   * Update an existing team build set
   */
  update: (id: number, data: Partial<TeamBuildSetOutput>) => {
    const url = buildUrl(BASE_ENDPOINTS.TEAM_BUILD_SET_BASE, id);
    return Api.put<TeamBuildSetInput>(url, data);
  },

  /**
   * DELETE /api/team-build-set/:id
   * Delete a team build set
   */
  delete: (id: number) => {
    const url = buildUrl(BASE_ENDPOINTS.TEAM_BUILD_SET_BASE, id);
    return Api.delete<void>(url);
  },
};
