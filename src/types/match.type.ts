import { BaseInputDto, BaseOutputDto } from './base.type';
import { GameInputDto } from './game.type';
import { TeamInputDto } from './team.type';
import { WeekInputDto } from './week.type';

export interface MatchInputDto extends BaseInputDto {
  weekId: number;
  losingTeamId: number;
  winningTeamId: number;
  week?: WeekInputDto;
  teams?: TeamInputDto[];
  losingTeam?: TeamInputDto;
  winningTeam?: TeamInputDto;
  games?: GameInputDto[];
}

export interface MatchOutputDto extends BaseOutputDto {
  weekId: number;
  losingTeamId?: number;
  winningTeamId?: number;
}
