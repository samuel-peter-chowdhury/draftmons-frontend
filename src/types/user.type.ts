import { BaseInputDto, BaseOutputDto } from './base.type';
import { LeagueUserInputDto } from './leagueUser.type';
import { TeamInputDto } from './team.type';

export interface UserInputDto extends BaseInputDto {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  isAdmin: boolean;
  googleId: string;
  showdownUsername: string;
  discordUsername: string;
  timezone: string;
  leagueUsers?: LeagueUserInputDto[];
  teams?: TeamInputDto[];
}

export interface UserOutputDto extends BaseOutputDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  isAdmin: boolean;
  googleId?: string;
  showdownUsername?: string;
  discordUsername?: string;
  timezone?: string;
}
