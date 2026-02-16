import { BaseInput, BaseOutput } from './base.type';
import { GameStatInput } from './gameStat.type';
import { PokemonInput } from './pokemon.type';
import { SeasonInput } from './season.type';
import { SeasonPokemonTeamInput } from './seasonPokemonTeam.type';

export interface SeasonPokemonInput extends BaseInput {
  seasonId: number;
  pokemonId: number;
  condition: string;
  pointValue: number;
  season?: SeasonInput;
  pokemon?: PokemonInput;
  seasonPokemonTeams?: SeasonPokemonTeamInput[];
  gameStats?: GameStatInput[];
}

export interface SeasonPokemonOutput extends BaseOutput {
  seasonId: number;
  pokemonId: number;
  condition?: string;
  pointValue?: number;
}
