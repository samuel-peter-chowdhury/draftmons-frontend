import { BaseInput, BaseOutput } from './base.type';
import { GameInput } from './game.type';
import { SeasonPokemonInput } from './seasonPokemon.type';

export interface GameStatInput extends BaseInput {
  gameId: number;
  seasonPokemonId: number;
  directKills: number;
  indirectKills: number;
  deaths: number;
  game?: GameInput;
  seasonPokemon?: SeasonPokemonInput;
}

export interface GameStatOutput extends BaseOutput {
  gameId: number;
  seasonPokemonId: number;
  directKills: number;
  indirectKills: number;
  deaths: number;
}
