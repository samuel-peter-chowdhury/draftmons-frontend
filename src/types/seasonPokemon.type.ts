import { BaseInputDto, BaseOutputDto } from './base.type';
import { GameStatInputDto } from './gameStat.type';
import { PokemonInputDto } from './pokemon.type';
import { SeasonInputDto } from './season.type';
import { TeamInputDto } from './team.type';

export interface SeasonPokemonInputDto extends BaseInputDto {
  seasonId: number;
  pokemonId: number;
  teamId: number;
  condition: string;
  pointValue: number;
  season?: SeasonInputDto;
  pokemon?: PokemonInputDto;
  team?: TeamInputDto;
  gameStats?: GameStatInputDto[];
}

export interface SeasonPokemonOutputDto extends BaseOutputDto {
  seasonId: number;
  pokemonId: number;
  teamId?: number;
  condition?: string;
  pointValue?: number;
}
