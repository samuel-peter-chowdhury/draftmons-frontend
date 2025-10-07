import { AbilityInputDto } from './ability.type';
import { BaseInputDto, BaseOutputDto } from './base.type';
import { GenerationInputDto } from './generation.type';
import { PokemonMoveInputDto } from './pokemonMove.type';
import { PokemonTypeInputDto } from './pokemonType.type';
import { SeasonPokemonInputDto } from './seasonPokemon.type';
import { TypeEffectiveInputDto } from './typeEffective.type';

export interface PokemonInputDto extends BaseInputDto {
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
  sprite: string;
  pokemonTypes: PokemonTypeInputDto[];
  pokemonMoves?: PokemonMoveInputDto[];
  abilities: AbilityInputDto[];
  typeEffectiveness?: TypeEffectiveInputDto[];
  seasonPokemon?: SeasonPokemonInputDto[];
  generations?: GenerationInputDto[];
}

export interface PokemonOutputDto extends BaseOutputDto {
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
  sprite: string;
}
