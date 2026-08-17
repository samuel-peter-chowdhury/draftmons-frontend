import type { calculateSpeedTiers } from '@/lib/pokemon';
import type { MoveInput, PokemonInput } from '@/types';

export const ROSTER_PAGE_SIZE = 50;
export const GAME_STATS_PAGE_SIZE = 999;
export const MOVES_PAGE_SIZE = 9999;

export interface SpeedTierPokemon {
  pokemon: PokemonInput;
  speedTiers: ReturnType<typeof calculateSpeedTiers>;
}

export interface TypeEffPokemon {
  pokemon: PokemonInput;
  effectivenessMap: Map<string, number>;
}

export interface TypeColumnInfo {
  name: string;
  abbreviation: string;
  color: string;
}

export interface SpecialMoveRow {
  move: MoveInput;
  teamAPokemon: PokemonInput[];
  teamBPokemon: PokemonInput[];
}

export interface SpecialMoveGroup {
  categoryName: string;
  rows: SpecialMoveRow[];
}

export interface CoverageRow {
  typeName: string;
  typeColor: string;
  teamAPokemon: PokemonInput[];
  teamBPokemon: PokemonInput[];
}

export function extractPaginatedData<T>(raw: { data: T[] } | null): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return raw.data;
}
