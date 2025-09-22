import { BaseInputDto, BaseOutputDto } from "./base.dto";
import { PokemonMoveInputDto } from "./pokemonMove.dto";
import { PokemonTypeInputDto } from "./pokemonType.dto";

export enum MoveCategory {
  PHYSICAL = "PHYSICAL",
  SPECIAL = "SPECIAL",
  STATUS = "STATUS",
}

export interface MoveInputDto extends BaseInputDto {
  name: string;
  pokemonTypeId: number;
  pokemonType?: PokemonTypeInputDto;
  category: MoveCategory;
  power: number;
  accuracy: number;
  priority: number;
  pp: number;
  description: string;
  pokemonMoves?: PokemonMoveInputDto[];
}

export interface MoveOutputDto extends BaseOutputDto {
  name: string;
  pokemonTypeId: number;
  category: MoveCategory;
  power: number;
  accuracy: number;
  priority: number;
  pp: number;
  description: string;
}
