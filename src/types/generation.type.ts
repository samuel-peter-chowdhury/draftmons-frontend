import { AbilityInput } from './ability.type';
import { BaseInput, BaseOutput } from './base.type';
import { MoveInput } from './move.type';
import { PokemonInput } from './pokemon.type';

export interface GenerationInput extends BaseInput {
  name: string;
  moves?: MoveInput[];
  abilities?: AbilityInput[];
  pokemon?: PokemonInput[];
}

export interface GenerationOutput extends BaseOutput {
  id: number;
  name: string;
}
