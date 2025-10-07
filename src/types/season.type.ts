import { BaseInputDto, BaseOutputDto } from './base.type';
import { LeagueInputDto } from './league.type';
import { SeasonPokemonInputDto } from './seasonPokemon.type';
import { TeamInputDto } from './team.type';
import { WeekInputDto } from './week.type';

export enum SeasonStatus {
  PRE_DRAFT = 'PRE_DRAFT',
  DRAFT = 'DRAFT',
  PRE_SEASON = 'PRE_SEASON',
  REGULAR_SEASON = 'REGULAR_SEASON',
  POST_SEASON = 'POST_SEASON',
  PLAYOFFS = 'PLAYOFFS',
}

export interface SeasonInputDto extends BaseInputDto {
  name: string;
  gen: string;
  status: SeasonStatus;
  rules: string;
  pointLimit: number;
  maxPointValue: number;
  leagueId: number;
  league?: LeagueInputDto;
  teams?: TeamInputDto[];
  weeks?: WeekInputDto[];
  seasonPokemon?: SeasonPokemonInputDto[];
}

export interface SeasonOutputDto extends BaseOutputDto {
  name: string;
  gen: string;
  status: SeasonStatus;
  rules?: string;
  pointLimit: number;
  maxPointValue: number;
  leagueId: number;
}
