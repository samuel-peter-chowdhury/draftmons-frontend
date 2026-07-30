import type { PokemonInput } from '@/types';
import type { TypeEffPokemon } from './constants';

/**
 * Normalizes Pokemon into the shape `TypeEffectivenessColumn` consumes: each
 * Pokemon paired with a lowercase-type-name → effectiveness-value lookup.
 * Shared by `useComparisonSide` (persisted team/build sides) and the team-build
 * Draft Prep coverage panel (in-memory roster).
 */
export function toTypeEffPokemon(pokemon: PokemonInput[]): TypeEffPokemon[] {
  return pokemon.map((pkmn) => {
    const effectivenessMap = new Map<string, number>();
    if (pkmn.typeEffectiveness) {
      for (const te of pkmn.typeEffectiveness) {
        if (te.pokemonType?.name) {
          effectivenessMap.set(te.pokemonType.name.toLowerCase(), te.value);
        }
      }
    }
    return { pokemon: pkmn, effectivenessMap };
  });
}
