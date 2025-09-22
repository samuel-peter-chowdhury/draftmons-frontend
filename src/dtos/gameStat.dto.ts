import { BaseInputDto, BaseOutputDto } from "./base.dto";
import { GameInputDto } from "./game.dto";
import { SeasonPokemonInputDto } from "./seasonPokemon.dto";

export interface GameStatInputDto extends BaseInputDto {
  gameId: number;
  seasonPokemonId: number;
  directKills: number;
  indirectKills: number;
  deaths: number;
  game?: GameInputDto;
  seasonPokemon?: SeasonPokemonInputDto;
}

export interface GameStatOutputDto extends BaseOutputDto {
  gameId: number;
  seasonPokemonId: number;
  directKills: number;
  indirectKills: number;
  deaths: number;
}
