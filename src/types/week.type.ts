import { BaseInputDto, BaseOutputDto } from './base.type';
import { MatchInputDto } from './match.type';
import { SeasonInputDto } from './season.type';

export interface WeekInputDto extends BaseInputDto {
  name: string;
  seasonId: number;
  season?: SeasonInputDto;
  matches?: MatchInputDto[];
}

export interface WeekOutputDto extends BaseOutputDto {
  name: string;
  seasonId: number;
}
