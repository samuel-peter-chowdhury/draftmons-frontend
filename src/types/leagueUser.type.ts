import { BaseInput, BaseOutput } from './base.type';
import { LeagueInput } from './league.type';
import { UserInput } from './user.type';

export interface LeagueUserInput extends BaseInput {
  leagueId: number;
  userId: number;
  isModerator: boolean;
  league?: LeagueInput;
  user?: UserInput;
}

export interface LeagueUserOutput extends BaseOutput {
  leagueId: number;
  userId: number;
  isModerator: boolean;
}
