import { BaseInput, BaseOutput } from './base.type';
import { GameInput } from './game.type';
import { TeamInput } from './team.type';
import { WeekInput } from './week.type';

// Mirror of backend MatchResultSource enum (draftmons-backend/src/entities/match.entity.ts).
// A null resultSource means "no result yet".
export enum MatchResultSource {
  REPLAY = 'REPLAY',
  MANUAL = 'MANUAL',
  FORFEIT = 'FORFEIT',
}

export interface MatchInput extends BaseInput {
  weekId: number;
  losingTeamId: number;
  winningTeamId: number;
  resultSource?: MatchResultSource | null;
  week?: WeekInput;
  teams?: TeamInput[];
  losingTeam?: TeamInput;
  winningTeam?: TeamInput;
  games?: GameInput[];
}

export interface MatchOutput extends BaseOutput {
  weekId: number;
  losingTeamId?: number;
  winningTeamId?: number;
  teamIds?: number[];
}
