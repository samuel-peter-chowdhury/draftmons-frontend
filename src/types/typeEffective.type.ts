import { BaseInputDto, BaseOutputDto } from './base.type';
import { PokemonTypeInputDto } from './pokemonType.type';
import { PokemonInputDto } from './pokemon.type';

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
