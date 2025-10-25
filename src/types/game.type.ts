import { BaseInput, BaseOutput } from './base.type';
import { GameStatInput } from './gameStat.type';
import { MatchInput } from './match.type';
import { TeamInput } from './team.type';

export interface GameInput extends BaseInput {
  matchId: number;
  losingTeamId: number;
  winningTeamId: number;
  differential: number;
  replayLink: string;
  match?: MatchInput;
  losingTeam?: TeamInput;
  winningTeam?: TeamInput;
  gameStats?: GameStatInput[];
}

export interface GameOutput extends BaseOutput {
  matchId: number;
  losingTeamId: number;
  winningTeamId: number;
  differential: number;
  replayLink?: string;
}
