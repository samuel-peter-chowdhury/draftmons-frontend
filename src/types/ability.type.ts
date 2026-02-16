import { BaseInput, BaseOutput } from './base.type';
import { GenerationInput } from './generation.type';
import { PokemonInput } from './pokemon.type';

export interface AbilityInput extends BaseInput {
  name: string;
  description: string;
  generationId: number;
  pokemon?: PokemonInput[];
  generation?: GenerationInput;
}

export interface AbilityOutput extends BaseOutput {
  name: string;
  description: string;
  generationId: number;
}
