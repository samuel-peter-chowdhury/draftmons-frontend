import { BaseInputDto, BaseOutputDto } from "./base.dto";
import { PokemonMoveInputDto } from "./pokemonMove.dto";
import { PokemonInputDto } from "./pokemon.dto";

export interface GenerationInputDto extends BaseInputDto {
  name: string;
  pokemonMoves?: PokemonMoveInputDto[];
  pokemon?: PokemonInputDto[];
}

export interface GenerationOutputDto extends BaseOutputDto {
  name: string;
}
