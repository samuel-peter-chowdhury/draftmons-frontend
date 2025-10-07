import { BaseInputDto, BaseOutputDto } from './base.type';
import { GameInputDto } from './game.type';
import { SeasonPokemonInputDto } from './seasonPokemon.type';

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
