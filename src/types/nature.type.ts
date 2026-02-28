import { BaseInput, BaseOutput } from './base.type';

export enum StatType {
  HP = 'HP',
  ATTACK = 'ATTACK',
  DEFENSE = 'DEFENSE',
  SPECIAL_ATTACK = 'SPECIAL_ATTACK',
  SPECIAL_DEFENSE = 'SPECIAL_DEFENSE',
  SPEED = 'SPEED',
}

export interface NatureInput extends BaseInput {
  name: string;
  description: string;
  positiveStat: StatType | null;
  negativeStat: StatType | null;
}

export interface NatureOutput extends BaseOutput {
  name: string;
  description: string;
  positiveStat?: StatType | null;
  negativeStat?: StatType | null;
}
