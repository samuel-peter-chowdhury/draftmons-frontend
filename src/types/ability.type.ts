import { BaseInput, BaseOutput } from './base.type';
import { PokemonInput } from './pokemon.type';

export interface AbilityInput extends BaseInput {
  name: string;
  description: string;
  pokemon?: PokemonInput[];
}

export interface AbilityOutput extends BaseOutput {
  name: string;
  description: string;
}
