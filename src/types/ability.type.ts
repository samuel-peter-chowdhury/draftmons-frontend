import { BaseInputDto, BaseOutputDto } from './base.type';
import { PokemonInputDto } from './pokemon.type';

export interface AbilityInputDto extends BaseInputDto {
  name: string;
  description: string;
  pokemon?: PokemonInputDto[];
}

export interface AbilityOutputDto extends BaseOutputDto {
  name: string;
  description: string;
}
