import { BaseInputDto, BaseOutputDto } from "./base.dto";
import { PokemonInputDto } from "./pokemon.dto";

export interface AbilityInputDto extends BaseInputDto {
  name: string;
  description: string;
  pokemon?: PokemonInputDto[];
}

export interface AbilityOutputDto extends BaseOutputDto {
  name: string;
  description: string;
}
