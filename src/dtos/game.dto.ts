import { BaseInputDto, BaseOutputDto } from "./base.dto";
import { GameStatInputDto } from "./gameStat.dto";
import { MatchInputDto } from "./match.dto";
import { TeamInputDto } from "./team.dto";

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
