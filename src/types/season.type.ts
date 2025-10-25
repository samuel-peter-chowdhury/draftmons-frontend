import { BaseInput, BaseOutput } from './base.type';
import { GenerationInput } from './generation.type';
import { LeagueInput } from './league.type';
import { SeasonPokemonInput } from './seasonPokemon.type';
import { TeamInput } from './team.type';
import { WeekInput } from './week.type';

export enum SeasonStatus {
  PRE_DRAFT = 'PRE_DRAFT',
  DRAFT = 'DRAFT',
  PRE_SEASON = 'PRE_SEASON',
  REGULAR_SEASON = 'REGULAR_SEASON',
  POST_SEASON = 'POST_SEASON',
  PLAYOFFS = 'PLAYOFFS',
}

export interface SeasonInput extends BaseInput {
  name: string;
  status: SeasonStatus;
  rules: string;
  pointLimit: number;
  maxPointValue: number;
  leagueId: number;
  generationId: number;
  league?: LeagueInput;
  generation?: GenerationInput;
  teams?: TeamInput[];
  weeks?: WeekInput[];
  seasonPokemon?: SeasonPokemonInput[];
}

export interface SeasonOutput extends BaseOutput {
  name: string;
  status: SeasonStatus;
  rules?: string;
  pointLimit: number;
  maxPointValue: number;
  leagueId: number;
  generationId: number;
}
