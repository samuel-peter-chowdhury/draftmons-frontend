import { BaseInput, BaseOutput } from './base.type';
import { GameInput } from './game.type';
import { MatchInput } from './match.type';
import { SeasonPokemonInput } from './seasonPokemon.type';
import { SeasonInput } from './season.type';
import { UserInput } from './user.type';

export interface TeamInput extends BaseInput {
  name: string;
  seasonId: number;
  userId: number;
  season?: SeasonInput;
  user?: UserInput;
  seasonPokemon?: SeasonPokemonInput[];
  lostGames?: GameInput[];
  wonGames?: GameInput[];
  matches?: MatchInput[];
  lostMatches?: MatchInput[];
  wonMatches?: MatchInput[];
}

export interface TeamOutput extends BaseOutput {
  name: string;
  seasonId: number;
  userId: number;
}
