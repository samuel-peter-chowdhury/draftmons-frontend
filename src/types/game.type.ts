import { BaseInputDto, BaseOutputDto } from './base.type';
import { GameStatInputDto } from './gameStat.type';
import { MatchInputDto } from './match.type';
import { TeamInputDto } from './team.type';

export interface GameInputDto extends BaseInputDto {
  matchId: number;
  losingTeamId: number;
  winningTeamId: number;
  differential: number;
  replayLink: string;
  match?: MatchInputDto;
  losingTeam?: TeamInputDto;
  winningTeam?: TeamInputDto;
  gameStats?: GameStatInputDto[];
}

export interface GameOutputDto extends BaseOutputDto {
  matchId: number;
  losingTeamId: number;
  winningTeamId: number;
  differential: number;
  replayLink?: string;
}
