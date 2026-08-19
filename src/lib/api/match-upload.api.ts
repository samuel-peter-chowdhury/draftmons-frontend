import { Api, buildUrl } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type {
  AnalyzeGameInput,
  GameAnalysisPreviewDto,
  ManualSubmitInputDto,
  ManualSubmitResultDto,
  MatchPreviewDto,
  PlayerOverrideInput,
  SubmitInputDto,
  SubmitResultDto,
} from '@/types';

/**
 * Match Upload API — wraps /api/league/:leagueId/match-upload/*
 *
 * analyze/submit drive the replay flow; analyze-game/submit-manual drive the
 * manual-entry flow, where a replay is optional per game.
 *
 * All endpoints require moderator authorization (isAuthReadLeagueModWrite).
 * Api.post throws ApiRequestError on non-2xx; the consuming page handles 409
 * (overwrite conflict) by reading (error as ApiRequestError).body.detail.
 */
export const MatchUploadApi = {
  /**
   * POST /api/league/:leagueId/match-upload/analyze
   * Returns MatchPreviewDto (200) with field-level errors accumulated in preview.errors[]
   */
  analyze: (
    leagueId: number,
    data: { seasonId: number; replayUrls: string[]; playerOverrides?: PlayerOverrideInput[] },
  ) => {
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

  /**
   * POST /api/league/:leagueId/match-upload/analyze-game
   * Single-replay preview against a known match. Returns GameAnalysisPreviewDto (200)
   * with `game: null` + populated errors[] when the replay can't be fetched/parsed.
   */
  analyzeGame: (leagueId: number, data: AnalyzeGameInput) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'match-upload', 'analyze-game');
    return Api.post<GameAnalysisPreviewDto>(url, data);
  },

  /**
   * POST /api/league/:leagueId/match-upload/submit-manual
   * Returns ManualSubmitResultDto (201). Throws ApiRequestError with status 409 +
   * body.detail on conflict, same shape as submit().
   */
  submitManual: (leagueId: number, data: ManualSubmitInputDto) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'match-upload', 'submit-manual');
    return Api.post<ManualSubmitResultDto>(url, data);
  },
};
