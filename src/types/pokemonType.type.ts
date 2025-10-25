import { BaseInput, BaseOutput } from './base.type';
import { MoveInput } from './move.type';
import { PokemonInput } from './pokemon.type';
import { TypeEffectiveInput } from './typeEffective.type';

export interface PokemonTypeInput extends BaseInput {
  name: string;
  color: string;
  moves?: MoveInput[];
  pokemon?: PokemonInput[];
  typeEffectiveness?: TypeEffectiveInput[];
}

export interface PokemonTypeOutput extends BaseOutput {
  name: string;
  color: string;
}
