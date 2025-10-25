import { BaseInput, BaseOutput } from './base.type';
import { GenerationInput } from './generation.type';
import { MoveInput } from './move.type';
import { PokemonInput } from './pokemon.type';

export interface PokemonMoveInput extends BaseInput {
  pokemonId: number;
  moveId: number;
  generationId: number;
  pokemon?: PokemonInput;
  move?: MoveInput;
  generation?: GenerationInput;
}

export interface PokemonMoveOutput extends BaseOutput {
  pokemonId: number;
  moveId: number;
  generationId: number;
}
