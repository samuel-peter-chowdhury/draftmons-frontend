import { BaseInput, BaseOutput } from './base.type';
import { GameStatInput } from './gameStat.type';
import { PokemonInput } from './pokemon.type';
import { SeasonInput } from './season.type';
import { TeamInput } from './team.type';

export interface SeasonPokemonInput extends BaseInput {
  seasonId: number;
  pokemonId: number;
  teamId: number;
  condition: string;
  pointValue: number;
  season?: SeasonInput;
  pokemon?: PokemonInput;
  team?: TeamInput;
  gameStats?: GameStatInput[];
}

export interface SeasonPokemonOutput extends BaseOutput {
  seasonId: number;
  pokemonId: number;
  teamId?: number;
  condition?: string;
  pointValue?: number;
}
