import { BaseInput, BaseOutput } from './base.type';
import { GenerationInput } from './generation.type';

export interface ItemInput extends BaseInput {
  name: string;
  description: string;
  generationId: number;
  generation?: GenerationInput;
}

export interface ItemOutput extends BaseOutput {
  name: string;
  description: string;
  generationId: number;
}
