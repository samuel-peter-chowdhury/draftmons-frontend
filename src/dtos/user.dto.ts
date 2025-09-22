import { BaseInputDto, BaseOutputDto } from "./base.dto";
import { LeagueUserInputDto } from "./leagueUser.dto";
import { TeamInputDto } from "./team.dto";

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
