import { BaseInputDto, BaseOutputDto } from "./base.dto";
import { LeagueInputDto } from "./league.dto";
import { UserInputDto } from "./user.dto";

export interface LeagueUserInputDto extends BaseInputDto {
  leagueId: number;
  userId: number;
  isModerator: boolean;
  league?: LeagueInputDto;
  user?: UserInputDto;
}

export interface LeagueUserOutputDto extends BaseOutputDto {
  leagueId: number;
  userId: number;
  isModerator: boolean;
}
