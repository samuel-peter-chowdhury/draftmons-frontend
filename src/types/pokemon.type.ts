import { AbilityInput } from './ability.type';
import { BaseInput, BaseOutput } from './base.type';
import { GenerationInput } from './generation.type';
import { PokemonMoveInput } from './pokemonMove.type';
import { PokemonTypeInput } from './pokemonType.type';
import { SeasonPokemonInput } from './seasonPokemon.type';
import { TypeEffectiveInput } from './typeEffective.type';

export interface PokemonInput extends BaseInput {
  dexId: number;
  name: string;
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
  baseStatTotal: number;
  height: number;
  weight: number;
  spriteUrl: string;
  pokemonTypes: PokemonTypeInput[];
  pokemonMoves?: PokemonMoveInput[];
  abilities: AbilityInput[];
  typeEffectiveness?: TypeEffectiveInput[];
  seasonPokemon?: SeasonPokemonInput[];
  generations?: GenerationInput[];
}

export interface PokemonOutput extends BaseOutput {
  dexId: number;
  name: string;
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
  baseStatTotal: number;
  height: number;
  weight: number;
  spriteUrl: string;
}
