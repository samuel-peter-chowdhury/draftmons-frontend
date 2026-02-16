import { BaseInput, BaseOutput } from './base.type';
import { GenerationInput } from './generation.type';
import { PokemonInput } from './pokemon.type';
import { PokemonTypeInput } from './pokemonType.type';
import { SpecialMoveCategoryInput } from './specialMoveCategory.type';

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
  generationId: number;
  pokemon?: PokemonInput[];
  generation?: GenerationInput;
  specialMoveCategories?: SpecialMoveCategoryInput[];
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
  generationId: number;
}
