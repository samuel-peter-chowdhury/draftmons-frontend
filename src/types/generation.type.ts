import { BaseInputDto, BaseOutputDto } from './base.type';
import { PokemonMoveInputDto } from './pokemonMove.type';
import { PokemonInputDto } from './pokemon.type';

export interface GenerationInputDto extends BaseInputDto {
  name: string;
  pokemonMoves?: PokemonMoveInputDto[];
  pokemon?: PokemonInputDto[];
}

export interface GenerationOutputDto extends BaseOutputDto {
  id: number;
  name: string;
}
