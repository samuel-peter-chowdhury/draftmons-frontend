import { BaseInput, BaseOutput } from './base.type';
import { LeagueUserInput } from './leagueUser.type';
import { TeamInput } from './team.type';

export interface UserInput extends BaseInput {
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
  googleId: string;
  showdownUsername: string;
  discordUsername: string;
  timezone: string;
  leagueUsers?: LeagueUserInput[];
  teams?: TeamInput[];
}

export interface UserOutput extends BaseOutput {
  firstName?: string;
  lastName?: string;
  email?: string;
  isAdmin: boolean;
  googleId?: string;
  showdownUsername?: string;
  discordUsername?: string;
  timezone?: string;
}
