import { BaseInputDto, BaseOutputDto } from './base.type';
import { GenerationInputDto } from './generation.type';
import { MoveInputDto } from './move.type';
import { PokemonInputDto } from './pokemon.type';

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
