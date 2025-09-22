import { BaseInputDto, BaseOutputDto } from "./base.dto";
import { GameInputDto } from "./game.dto";
import { MatchInputDto } from "./match.dto";
import { SeasonPokemonInputDto } from "./seasonPokemon.dto";
import { SeasonInputDto } from "./season.dto";
import { UserInputDto } from "./user.dto";

export interface TeamInputDto extends BaseInputDto {
  name: string;
  seasonId: number;
  userId: number;
  season?: SeasonInputDto;
  user?: UserInputDto;
  seasonPokemon?: SeasonPokemonInputDto[];
  lostGames?: GameInputDto[];
  wonGames?: GameInputDto[];
  matches?: MatchInputDto[];
  lostMatches?: MatchInputDto[];
  wonMatches?: MatchInputDto[];
}

export interface TeamOutputDto extends BaseOutputDto {
  name: string;
  seasonId: number;
  userId: number;
}
