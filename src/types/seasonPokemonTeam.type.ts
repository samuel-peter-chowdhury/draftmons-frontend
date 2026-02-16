import { BaseInput, BaseOutput } from './base.type';
import { SeasonPokemonInput } from './seasonPokemon.type';
import { TeamInput } from './team.type';

export interface SeasonPokemonTeamInput extends BaseInput {
  seasonPokemonId: number;
  teamId: number;
  seasonPokemon?: SeasonPokemonInput;
  team?: TeamInput;
}

export interface SeasonPokemonTeamOutput extends BaseOutput {
  seasonPokemonId: number;
  teamId: number;
}
