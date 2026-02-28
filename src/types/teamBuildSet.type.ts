import { BaseInput, BaseOutput } from './base.type';
import { TeamBuildInput } from './teamBuild.type';
import { PokemonInput } from './pokemon.type';
import { ItemInput } from './item.type';
import { AbilityInput } from './ability.type';
import { MoveInput } from './move.type';
import { NatureInput } from './nature.type';

export interface TeamBuildSetInput extends BaseInput {
  teamBuildId: number;
  pokemonId: number;
  pointValue: number | null;
  condition: string | null;
  itemId: number | null;
  abilityId: number | null;
  move1Id: number | null;
  move2Id: number | null;
  move3Id: number | null;
  move4Id: number | null;
  hpEv: number;
  attackEv: number;
  defenseEv: number;
  specialAttackEv: number;
  specialDefenseEv: number;
  speedEv: number;
  hpIv: number;
  attackIv: number;
  defenseIv: number;
  specialAttackIv: number;
  specialDefenseIv: number;
  speedIv: number;
  natureId: number | null;
  teamBuild?: TeamBuildInput;
  pokemon?: PokemonInput;
  item?: ItemInput;
  ability?: AbilityInput;
  move1?: MoveInput;
  move2?: MoveInput;
  move3?: MoveInput;
  move4?: MoveInput;
  nature?: NatureInput;
}

export interface TeamBuildSetOutput extends BaseOutput {
  teamBuildId: number;
  pokemonId: number;
  pointValue?: number;
  condition?: string;
  itemId?: number;
  abilityId?: number;
  move1Id?: number;
  move2Id?: number;
  move3Id?: number;
  move4Id?: number;
  hpEv?: number;
  attackEv?: number;
  defenseEv?: number;
  specialAttackEv?: number;
  specialDefenseEv?: number;
  speedEv?: number;
  hpIv?: number;
  attackIv?: number;
  defenseIv?: number;
  specialAttackIv?: number;
  specialDefenseIv?: number;
  speedIv?: number;
  natureId?: number;
}
