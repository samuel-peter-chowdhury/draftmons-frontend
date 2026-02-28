import { BaseInput, BaseOutput } from './base.type';
import { UserInput } from './user.type';
import { SeasonInput } from './season.type';
import { GenerationInput } from './generation.type';
import { TeamBuildSetInput } from './teamBuildSet.type';

export interface TeamBuildInput extends BaseInput {
  name: string;
  userId: number;
  seasonId: number | null;
  generationId: number;
  user?: UserInput;
  season?: SeasonInput;
  generation?: GenerationInput;
  teamBuildSets?: TeamBuildSetInput[];
}

export interface TeamBuildOutput extends BaseOutput {
  name: string;
  userId: number;
  seasonId?: number;
  generationId: number;
}
