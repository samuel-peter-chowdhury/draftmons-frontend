import { BaseInput, BaseOutput } from './base.type';
import { PokemonMoveInput } from './pokemonMove.type';
import { PokemonInput } from './pokemon.type';

export interface GenerationInput extends BaseInput {
  name: string;
  pokemonMoves?: PokemonMoveInput[];
  pokemon?: PokemonInput[];
}

export interface GenerationOutput extends BaseOutput {
  id: number;
  name: string;
}
