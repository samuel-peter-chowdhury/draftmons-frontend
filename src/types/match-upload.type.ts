// Mirror of backend PreviewErrorCode enum (draftmons-backend/src/dtos/match-analysis.dto.ts)
export enum PreviewErrorCode {
  REPLAY_NOT_FOUND = 'REPLAY_NOT_FOUND',
  REPLAY_PRIVATE = 'REPLAY_PRIVATE',
  REPLAY_TIMEOUT = 'REPLAY_TIMEOUT',
  REPLAY_UPSTREAM = 'REPLAY_UPSTREAM',
  REPLAY_PARSE = 'REPLAY_PARSE',
  REPLAY_DUPLICATE = 'REPLAY_DUPLICATE',
  COUNT_OUT_OF_RANGE = 'COUNT_OUT_OF_RANGE',
  PLAYERS_INCONSISTENT = 'PLAYERS_INCONSISTENT',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  MATCH_NOT_FOUND = 'MATCH_NOT_FOUND',
  MATCH_AMBIGUOUS = 'MATCH_AMBIGUOUS',
  MATCH_BLOCKED = 'MATCH_BLOCKED',
  POKEMON_NOT_FOUND = 'POKEMON_NOT_FOUND',
  POKEMON_AMBIGUOUS = 'POKEMON_AMBIGUOUS',
  GAME_INDECISIVE = 'GAME_INDECISIVE',
  SET_NOT_DECISIVE = 'SET_NOT_DECISIVE',
}

// Preview types — received from /analyze. Not DB entities; do NOT extend BaseInput.
export interface PreviewErrorDto {
  field: string;
  code: PreviewErrorCode;
  message: string;
  candidates?: unknown[];
}

export interface PlayerPreviewDto {
  rawShowdownName: string;
  userId: number | null;
  userDisplayName: string | null;
  teamId: number | null;
  teamName: string | null;
}

export interface StatPreviewDto {
  rawName: string;
  seasonPokemonId: number | null;
  name: string | null;
  teamId: number | null;
  directKills: number;
  indirectKills: number;
  deaths: number;
}

export interface GamePreviewDto {
  gameNumber: number;
  replayUrl: string;
  winnerTeamId: number | null;
  loserTeamId: number | null;
  differential: number | null;
  stats: StatPreviewDto[];
}

export interface MatchPreviewDto {
  seasonId: number;
  replayUrls: string[];
  matchId: number | null;
  weekId: number | null;
  weekName: string | null;
  players: PlayerPreviewDto[];
  games: GamePreviewDto[];
  matchWinnerTeamId: number | null;
  matchLoserTeamId: number | null;
  isDecisive: boolean;
  errors: PreviewErrorDto[];
}

// Submit types — sent to /submit. These map to SubmitInputDto on the backend.
// Non-null required IDs (resolved values only).
export interface SubmitStatInput {
  seasonPokemonId: number;
  directKills: number;
  indirectKills: number;
  deaths: number;
}

export interface SubmitGameInput {
  gameNumber: number;
  replayLink: string;
  winningTeamId: number;
  losingTeamId: number;
  differential: number;
  stats: SubmitStatInput[];
}

export interface SubmitInputDto {
  seasonId: number;
  matchId: number;
  confirmOverwrite: boolean;
  games: SubmitGameInput[];
}

// Result type for /submit 201 response
export interface SubmitResultDto {
  matchId: number;
  games: { id: number; gameNumber: number; replayLink: string }[];
}
