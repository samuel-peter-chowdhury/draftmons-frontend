import { BaseInput, BaseOutput } from './base.type';
import { PokemonTypeInput } from './pokemonType.type';
import { PokemonInput } from './pokemon.type';

export interface TypeEffectiveInput extends BaseInput {
  pokemonId: number;
  pokemonTypeId: number;
  pokemonType?: PokemonTypeInput;
  value: number;
  pokemon?: PokemonInput;
}

export interface TypeEffectiveOutput extends BaseOutput {
  pokemonId: number;
  pokemonTypeId: number;
  value: number;
}
