import { BaseInputDto, BaseOutputDto } from "./base.dto";
import { PokemonTypeInputDto } from "./pokemonType.dto";
import { PokemonInputDto } from "./pokemon.dto";

export interface TypeEffectiveInputDto extends BaseInputDto {
  pokemonId: number;
  pokemonTypeId: number;
  pokemonType?: PokemonTypeInputDto;
  value: number;
  pokemon?: PokemonInputDto;
}

export interface TypeEffectiveOutputDto extends BaseOutputDto {
  pokemonId: number;
  pokemonTypeId: number;
  value: number;
}
