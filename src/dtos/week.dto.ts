import { BaseInputDto, BaseOutputDto } from "./base.dto";
import { MatchInputDto } from "./match.dto";
import { SeasonInputDto } from "./season.dto";

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
