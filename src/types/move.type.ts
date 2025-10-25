import { BaseInput, BaseOutput } from './base.type';
import { PokemonMoveInput } from './pokemonMove.type';
import { PokemonTypeInput } from './pokemonType.type';

export enum MoveCategory {
  PHYSICAL = 'PHYSICAL',
  SPECIAL = 'SPECIAL',
  STATUS = 'STATUS',
}

export interface MoveInput extends BaseInput {
  name: string;
  pokemonTypeId: number;
  pokemonType?: PokemonTypeInput;
  category: MoveCategory;
  power: number;
  accuracy: number;
  priority: number;
  pp: number;
  description: string;
  pokemonMoves?: PokemonMoveInput[];
}

export interface MoveOutput extends BaseOutput {
  name: string;
  pokemonTypeId: number;
  category: MoveCategory;
  power: number;
  accuracy: number;
  priority: number;
  pp: number;
  description: string;
}
