import { AbilityInputDto } from "./ability.dto";
import { BaseInputDto, BaseOutputDto } from "./base.dto";
import { GenerationInputDto } from "./generation.dto";
import { PokemonMoveInputDto } from "./pokemonMove.dto";
import { PokemonTypeInputDto } from "./pokemonType.dto";
import { SeasonPokemonInputDto } from "./seasonPokemon.dto";
import { TypeEffectiveInputDto } from "./typeEffective.dto";

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
