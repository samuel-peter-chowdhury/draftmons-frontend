import { Api, buildUrl, buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type {
  LeagueInput,
  LeagueOutput,
  LeagueUserInput,
  GameStatInput,
  GameInput,
  MatchInput,
  SeasonPokemonInput,
  SeasonInput,
  SeasonOutput,
  TeamInput,
  WeekInput,
  PaginatedResponse,
} from '@/types';

/**
 * League API - handles all /api/league endpoints and sub-resources
 */
export const LeagueApi = {
  // ==================== League Base Operations ====================

  /**
   * GET /api/league?page=1&pageSize=10&sortBy=name&sortOrder=ASC
   * Get paginated list of leagues
   */
  getAll: (params: {
    page: number;
    pageSize: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) => {
    const url = buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [], params);
    return Api.get<PaginatedResponse<LeagueInput>>(url);
  },

  /**
   * GET /api/league/:id?full=true
   * Get a single league by ID
   */
  getById: (id: number, full = false) => {
    const url = buildUrlWithQuery(
      BASE_ENDPOINTS.LEAGUE_BASE,
      [id],
      full ? { full: 'true' } : undefined,
    );
    return Api.get<LeagueInput>(url);
  },

  /**
   * POST /api/league
   * Create a new league
   */
  create: (data: LeagueOutput) => {
    return Api.post<LeagueInput>(BASE_ENDPOINTS.LEAGUE_BASE, data);
  },

  /**
   * PUT /api/league/:id
   * Update an existing league
   */
  update: (id: number, data: LeagueOutput) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, id);
    return Api.put<LeagueInput>(url, data);
  },

  /**
   * DELETE /api/league/:id
   * Delete a league
   */
  delete: (id: number) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, id);
    return Api.delete<void>(url);
  },

  // ==================== League User Operations ====================

  /**
   * GET /api/league/:leagueId/league-user
   * Get all users in a league
   */
  getLeagueUsers: (leagueId: number) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'league-user');
    return Api.get<LeagueUserInput[]>(url);
  },

  /**
   * GET /api/league/:leagueId/league-user/:leagueUserId
   * Get a specific league user
   */
  getLeagueUser: (leagueId: number, leagueUserId: number) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'league-user', leagueUserId);
    return Api.get<LeagueUserInput>(url);
  },

  /**
   * POST /api/league/:leagueId/league-user
   * Add a user to a league
   */
  addUser: (leagueId: number, data: { userId: number; isModerator: boolean }) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'league-user');
    return Api.post<LeagueUserInput>(url, { ...data, leagueId });
  },

  /**
   * PUT /api/league/:leagueId/league-user/:leagueUserId
   * Update a league user
   */
  updateLeagueUser: (leagueId: number, leagueUserId: number, data: Partial<LeagueUserInput>) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'league-user', leagueUserId);
    return Api.put<LeagueUserInput>(url, data);
  },

  /**
   * DELETE /api/league/:leagueId/league-user/:leagueUserId
   * Remove a user from a league
   */
  removeUser: (leagueId: number, leagueUserId: number) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'league-user', leagueUserId);
    return Api.delete<void>(url);
  },

  // ==================== Season Operations ====================

  /**
   * GET /api/league/:leagueId/season
   * Get all seasons in a league
   */
  getSeasons: (leagueId: number) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'season');
    return Api.get<SeasonInput[]>(url);
  },

  /**
   * GET /api/league/:leagueId/season/:seasonId
   * Get a specific season
   */
  getSeason: (leagueId: number, seasonId: number) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'season', seasonId);
    return Api.get<SeasonInput>(url);
  },

  /**
   * POST /api/league/:leagueId/season
   * Create a new season in a league
   */
  createSeason: (leagueId: number, data: SeasonOutput) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'season');
    return Api.post<SeasonInput>(url, { ...data, leagueId });
  },

  /**
   * PUT /api/league/:leagueId/season/:seasonId
   * Update a season
   */
  updateSeason: (leagueId: number, seasonId: number, data: Partial<SeasonOutput>) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'season', seasonId);
    return Api.put<SeasonInput>(url, data);
  },

  /**
   * DELETE /api/league/:leagueId/season/:seasonId
   * Delete a season
   */
  deleteSeason: (leagueId: number, seasonId: number) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'season', seasonId);
    return Api.delete<void>(url);
  },

  // ==================== Team Operations ====================

  /**
   * GET /api/league/:leagueId/team
   * Get all teams in a league
   */
  getTeams: (leagueId: number) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'team');
    return Api.get<TeamInput[]>(url);
  },

  /**
   * GET /api/league/:leagueId/team/:teamId
   * Get a specific team
   */
  getTeam: (leagueId: number, teamId: number) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'team', teamId);
    return Api.get<TeamInput>(url);
  },

  /**
   * POST /api/league/:leagueId/team
   * Create a new team
   */
  createTeam: (leagueId: number, data: unknown) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'team');
    return Api.post<TeamInput>(url, data);
  },

  /**
   * PUT /api/league/:leagueId/team/:teamId
   * Update a team
   */
  updateTeam: (leagueId: number, teamId: number, data: unknown) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'team', teamId);
    return Api.put<TeamInput>(url, data);
  },

  /**
   * DELETE /api/league/:leagueId/team/:teamId
   * Delete a team
   */
  deleteTeam: (leagueId: number, teamId: number) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'team', teamId);
    return Api.delete<void>(url);
  },

  // ==================== Week Operations ====================

  /**
   * GET /api/league/:leagueId/week
   * Get all weeks in a league
   */
  getWeeks: (leagueId: number) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'week');
    return Api.get<WeekInput[]>(url);
  },

  /**
   * GET /api/league/:leagueId/week/:weekId
   * Get a specific week
   */
  getWeek: (leagueId: number, weekId: number) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'week', weekId);
    return Api.get<WeekInput>(url);
  },

  /**
   * POST /api/league/:leagueId/week
   * Create a new week
   */
  createWeek: (leagueId: number, data: unknown) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'week');
    return Api.post<WeekInput>(url, data);
  },

  /**
   * PUT /api/league/:leagueId/week/:weekId
   * Update a week
   */
  updateWeek: (leagueId: number, weekId: number, data: unknown) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'week', weekId);
    return Api.put<WeekInput>(url, data);
  },

  /**
   * DELETE /api/league/:leagueId/week/:weekId
   * Delete a week
   */
  deleteWeek: (leagueId: number, weekId: number) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'week', weekId);
    return Api.delete<void>(url);
  },

  // ==================== Match Operations ====================

  /**
   * GET /api/league/:leagueId/match
   * Get all matches in a league
   */
  getMatches: (leagueId: number) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'match');
    return Api.get<MatchInput[]>(url);
  },

  /**
   * GET /api/league/:leagueId/match/:matchId
   * Get a specific match
   */
  getMatch: (leagueId: number, matchId: number) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'match', matchId);
    return Api.get<MatchInput>(url);
  },

  /**
   * POST /api/league/:leagueId/match
   * Create a new match
   */
  createMatch: (leagueId: number, data: unknown) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'match');
    return Api.post<MatchInput>(url, data);
  },

  /**
   * PUT /api/league/:leagueId/match/:matchId
   * Update a match
   */
  updateMatch: (leagueId: number, matchId: number, data: unknown) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'match', matchId);
    return Api.put<MatchInput>(url, data);
  },

  /**
   * DELETE /api/league/:leagueId/match/:matchId
   * Delete a match
   */
  deleteMatch: (leagueId: number, matchId: number) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'match', matchId);
    return Api.delete<void>(url);
  },

  // ==================== Game Operations ====================

  /**
   * GET /api/league/:leagueId/game
   * Get all games in a league
   */
  getGames: (leagueId: number) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'game');
    return Api.get<GameInput[]>(url);
  },

  /**
   * GET /api/league/:leagueId/game/:gameId
   * Get a specific game
   */
  getGame: (leagueId: number, gameId: number) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'game', gameId);
    return Api.get<GameInput>(url);
  },

  /**
   * POST /api/league/:leagueId/game
   * Create a new game
   */
  createGame: (leagueId: number, data: unknown) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'game');
    return Api.post<GameInput>(url, data);
  },

  /**
   * PUT /api/league/:leagueId/game/:gameId
   * Update a game
   */
  updateGame: (leagueId: number, gameId: number, data: unknown) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'game', gameId);
    return Api.put<GameInput>(url, data);
  },

  /**
   * DELETE /api/league/:leagueId/game/:gameId
   * Delete a game
   */
  deleteGame: (leagueId: number, gameId: number) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'game', gameId);
    return Api.delete<void>(url);
  },

  // ==================== Game Stat Operations ====================

  /**
   * GET /api/league/:leagueId/game-stat
   * Get all game stats in a league
   */
  getGameStats: (leagueId: number) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'game-stat');
    return Api.get<GameStatInput[]>(url);
  },

  /**
   * GET /api/league/:leagueId/game-stat/:gameStatId
   * Get a specific game stat
   */
  getGameStat: (leagueId: number, gameStatId: number) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'game-stat', gameStatId);
    return Api.get<GameStatInput>(url);
  },

  /**
   * POST /api/league/:leagueId/game-stat
   * Create a new game stat
   */
  createGameStat: (leagueId: number, data: unknown) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'game-stat');
    return Api.post<GameStatInput>(url, data);
  },

  /**
   * PUT /api/league/:leagueId/game-stat/:gameStatId
   * Update a game stat
   */
  updateGameStat: (leagueId: number, gameStatId: number, data: unknown) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'game-stat', gameStatId);
    return Api.put<GameStatInput>(url, data);
  },

  /**
   * DELETE /api/league/:leagueId/game-stat/:gameStatId
   * Delete a game stat
   */
  deleteGameStat: (leagueId: number, gameStatId: number) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'game-stat', gameStatId);
    return Api.delete<void>(url);
  },

  // ==================== Season Pokemon Operations ====================

  /**
   * GET /api/league/:leagueId/season-pokemon
   * Get all season pokemon in a league
   */
  getSeasonPokemon: (leagueId: number) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'season-pokemon');
    return Api.get<SeasonPokemonInput[]>(url);
  },

  /**
   * GET /api/league/:leagueId/season-pokemon/:seasonPokemonId
   * Get a specific season pokemon
   */
  getSeasonPokemonById: (leagueId: number, seasonPokemonId: number) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'season-pokemon', seasonPokemonId);
    return Api.get<SeasonPokemonInput>(url);
  },

  /**
   * POST /api/league/:leagueId/season-pokemon
   * Create a new season pokemon
   */
  createSeasonPokemon: (leagueId: number, data: unknown) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'season-pokemon');
    return Api.post<SeasonPokemonInput>(url, data);
  },

  /**
   * PUT /api/league/:leagueId/season-pokemon/:seasonPokemonId
   * Update a season pokemon
   */
  updateSeasonPokemon: (leagueId: number, seasonPokemonId: number, data: unknown) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'season-pokemon', seasonPokemonId);
    return Api.put<SeasonPokemonInput>(url, data);
  },

  /**
   * DELETE /api/league/:leagueId/season-pokemon/:seasonPokemonId
   * Delete a season pokemon
   */
  deleteSeasonPokemon: (leagueId: number, seasonPokemonId: number) => {
    const url = buildUrl(BASE_ENDPOINTS.LEAGUE_BASE, leagueId, 'season-pokemon', seasonPokemonId);
    return Api.delete<void>(url);
  },
};
