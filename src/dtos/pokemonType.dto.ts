import { BaseInputDto, BaseOutputDto } from "./base.dto";
import { MoveInputDto } from "./move.dto";
import { PokemonInputDto } from "./pokemon.dto";
import { TypeEffectiveInputDto } from "./typeEffective.dto";

export interface PokemonTypeInputDto extends BaseInputDto {
  name: string;
  color: string;
  moves?: MoveInputDto[];
  pokemon?: PokemonInputDto[];
  typeEffectiveness?: TypeEffectiveInputDto[];
}

export interface PokemonTypeOutputDto extends BaseOutputDto {
  name: string;
  color: string;
}
