import { BaseInputDto, BaseOutputDto } from './base.type';
import { LeagueUserInputDto } from './leagueUser.type';
import { SeasonInputDto } from './season.type';

export interface LeagueInputDto extends BaseInputDto {
  name: string;
  abbreviation: string;
  leagueUsers?: LeagueUserInputDto[];
  seasons?: SeasonInputDto[];
}

export interface LeagueOutputDto extends BaseOutputDto {
  name: string;
  abbreviation: string;
}
