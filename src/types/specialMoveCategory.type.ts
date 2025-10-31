import { BaseInput, BaseOutput } from './base.type';
import { MoveInput } from './move.type';

export interface SpecialMoveCategoryInput extends BaseInput {
  name: string;
  moves?: MoveInput[];
}

export interface SpecialMoveCategoryOutput extends BaseOutput {
  name: string;
}
