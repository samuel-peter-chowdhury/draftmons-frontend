/**
 * Pure, framework-free helpers for Rapid Placement Mode.
 *
 * These functions hold the create-vs-update branch contract (the phase's
 * trickiest correctness concern, Pitfall 1/3 in 08-RESEARCH.md) and the
 * optimistic-insert placeholder-id scheme. No network calls, no DOM.
 *
 * `SeasonPokemonInput` is imported with `import type` only — type-only
 * imports are erased at compile time, so `rapidPlacement.smoke.mts` can run
 * under `tsx` without path-alias resolution (see `src/lib/csv.smoke.mts`).
 */

import type { SeasonPokemonInput } from '@/types';

/**
 * Builds a Map of SeasonPokemon rows keyed by pokemonId — the RAPID-02 join
 * between the full generation dex and the season's current tier assignments.
 */
export function buildSpByPokemonId(spList: SeasonPokemonInput[]): Map<number, SeasonPokemonInput> {
  const map = new Map<number, SeasonPokemonInput>();
  for (const sp of spList) {
    map.set(sp.pokemonId, sp);
  }
  return map;
}

/**
 * Decides whether a tier-button click should create a new SeasonPokemon row
 * or update an existing one. Branches strictly on row EXISTENCE — never on
 * `pointValue`, since a row can legitimately exist with `pointValue: 0`
 * (Pitfall 1, D-RAPID-04).
 */
export function decideTierAction(existingSp: SeasonPokemonInput | undefined): 'create' | 'update' {
  return existingSp ? 'update' : 'create';
}

/**
 * Deterministic, always-negative placeholder id for an optimistic insert
 * before `createMutation` resolves with the real (positive) id. Negative
 * values can never collide with a real SeasonPokemon id (RESEARCH.md Open
 * Question 2 / Pitfall 3).
 */
export function placeholderIdFor(pokemonId: number): number {
  return -pokemonId;
}

/**
 * Whether the remove button should be enabled — false when no SeasonPokemon
 * row exists to delete (Pitfall 1: remove is a no-op with nothing to remove).
 */
export function canRemove(existingSp: SeasonPokemonInput | undefined): boolean {
  return existingSp !== undefined;
}
