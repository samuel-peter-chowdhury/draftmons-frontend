import { BaseInputDto, BaseOutputDto } from "./base.dto";
import { GameStatInputDto } from "./gameStat.dto";
import { PokemonInputDto } from "./pokemon.dto";
import { SeasonInputDto } from "./season.dto";
import { TeamInputDto } from "./team.dto";

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
