import type { MatchResultSource } from './match.type';

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
  PLAYER_UNRESOLVED = 'PLAYER_UNRESOLVED',
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

// A moderator's direct team pick for an unresolved player, sent back to
// /analyze so the pipeline can resolve that player straight to a team
// (including an unassigned/ownerless one) instead of via showdownUsername
// matching.
export interface PlayerOverrideInput {
  playerIndex: number;
  teamId: number;
}

// Candidate shape for PLAYER_UNRESOLVED errors — every remaining season
// roster team (owned or unassigned).
export interface TeamCandidate {
  teamId: number;
  teamName: string;
  userId: number | null;
  userDisplayName: string | null;
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

// ─── Manual / forfeit entry ───────────────────────────────────────────────────
// Mirror of the backend's AnalyzeGameInputDto / ManualSubmitInputDto. These map
// to /match-upload/analyze-game and /match-upload/submit-manual, the no-replay-
// required counterparts to /analyze and /submit.

// Sent to /analyze-game — the target match is already known, so a single replay
// is resolved against that match's two teams rather than the season roster.
export interface AnalyzeGameInput {
  matchId: number;
  replayUrl: string;
  playerOverrides?: PlayerOverrideInput[];
}

// Received from /analyze-game. `game` is null when the replay could not be
// fetched or parsed; recoverable problems land in errors[] as usual.
export interface GameAnalysisPreviewDto {
  matchId: number;
  replayUrl: string;
  players: PlayerPreviewDto[];
  game: GamePreviewDto | null;
  errors: PreviewErrorDto[];
}

// Sent to /submit-manual. Looser than SubmitGameInput on purpose: a manually
// recorded game may have no replay link and no stats at all.
export interface ManualStatInput {
  seasonPokemonId: number;
  directKills: number;
  indirectKills: number;
  deaths: number;
}

export interface ManualGameInput {
  winningTeamId: number;
  losingTeamId: number;
  differential?: number;
  replayLink?: string;
  stats?: ManualStatInput[];
}

// gameNumber is assigned server-side from array order. `games` may be empty for a
// FORFEIT with no score; MANUAL requires a strict-majority winner matching
// winningTeamId. resultSource is narrowed to the two hand-entered sources —
// REPLAY belongs to the parsed-replay flow.
export interface ManualSubmitInputDto {
  matchId: number;
  resultSource: MatchResultSource.MANUAL | MatchResultSource.FORFEIT;
  confirmOverwrite: boolean;
  winningTeamId: number;
  losingTeamId: number;
  games: ManualGameInput[];
}

// Result type for /submit-manual 201 response
export interface ManualSubmitResultDto {
  matchId: number;
  resultSource: MatchResultSource;
  winningTeamId: number;
  losingTeamId: number;
  games: { id: number; gameNumber: number; replayLink: string | null }[];
}
