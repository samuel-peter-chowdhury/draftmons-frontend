import { AbilityInput } from './ability.type';
import { BaseInput, BaseOutput } from './base.type';
import { GenerationInput } from './generation.type';
import { MoveInput } from './move.type';
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
  generationId: number;
  pokemonTypes: PokemonTypeInput[];
  moves?: MoveInput[];
  abilities: AbilityInput[];
  typeEffectiveness?: TypeEffectiveInput[];
  seasonPokemon?: SeasonPokemonInput[];
  generation?: GenerationInput;
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
  generationId: number;
}
