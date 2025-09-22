import { BaseInputDto, BaseOutputDto } from "./base.dto";
import { GameInputDto } from "./game.dto";
import { TeamInputDto } from "./team.dto";
import { WeekInputDto } from "./week.dto";

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
