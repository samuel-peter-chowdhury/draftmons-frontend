import { Api, buildUrl } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { MatchPreviewDto, SubmitInputDto, SubmitResultDto } from '@/types';

/**
 * Match Upload API — wraps /api/league/:leagueId/match-upload/{analyze|submit}
 *
 * Both endpoints require moderator authorization (isAuthReadLeagueModWrite).
 * Api.post throws ApiRequestError on non-2xx; the consuming page handles 409
 * (overwrite conflict) by reading (error as ApiRequestError).body.detail.
 */
export const MatchUploadApi = {
  /**
   * POST /api/league/:leagueId/match-upload/analyze
   * Returns MatchPreviewDto (200) with field-level errors accumulated in preview.errors[]
   */
  analyze: (leagueId: number, data: { seasonId: number; replayUrls: string[] }) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'match-upload', 'analyze');
    return Api.post<MatchPreviewDto>(url, data);
  },

  /**
   * POST /api/league/:leagueId/match-upload/submit
   * Returns SubmitResultDto (201). Throws ApiRequestError with status 409 + body.detail on conflict.
   */
  submit: (leagueId: number, data: SubmitInputDto) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'match-upload', 'submit');
    return Api.post<SubmitResultDto>(url, data);
  },
};
