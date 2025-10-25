import { BaseInput, BaseOutput } from './base.type';
import { MatchInput } from './match.type';
import { SeasonInput } from './season.type';

export interface WeekInput extends BaseInput {
  name: string;
  seasonId: number;
  season?: SeasonInput;
  matches?: MatchInput[];
}

export interface WeekOutput extends BaseOutput {
  name: string;
  seasonId: number;
}
