import { BaseInputDto, BaseOutputDto } from "./base.dto";
import { GenerationInputDto } from "./generation.dto";
import { MoveInputDto } from "./move.dto";
import { PokemonInputDto } from "./pokemon.dto";

export interface PokemonMoveInputDto extends BaseInputDto {
  pokemonId: number;
  moveId: number;
  generationId: number;
  pokemon?: PokemonInputDto;
  move?: MoveInputDto;
  generation?: GenerationInputDto;
}

export interface PokemonMoveOutputDto extends BaseOutputDto {
  pokemonId: number;
  moveId: number;
  generationId: number;
}
