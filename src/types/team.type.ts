import { BaseInputDto, BaseOutputDto } from './base.type';
import { GameInputDto } from './game.type';
import { MatchInputDto } from './match.type';
import { SeasonPokemonInputDto } from './seasonPokemon.type';
import { SeasonInputDto } from './season.type';
import { UserInputDto } from './user.type';

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
