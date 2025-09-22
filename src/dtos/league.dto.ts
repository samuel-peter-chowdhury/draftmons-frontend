import { BaseInputDto, BaseOutputDto } from "./base.dto";
import { LeagueUserInputDto } from "./leagueUser.dto";
import { SeasonInputDto } from "./season.dto";

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
