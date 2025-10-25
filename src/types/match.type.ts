import { BaseInput, BaseOutput } from './base.type';
import { GameInput } from './game.type';
import { TeamInput } from './team.type';
import { WeekInput } from './week.type';

export interface MatchInput extends BaseInput {
  weekId: number;
  losingTeamId: number;
  winningTeamId: number;
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
}
