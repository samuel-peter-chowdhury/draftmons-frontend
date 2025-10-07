import { BaseInputDto, BaseOutputDto } from './base.type';
import { LeagueInputDto } from './league.type';
import { UserInputDto } from './user.type';

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
