import type { PokemonInput } from '@/types';
import type { StatTablePokemon, TypeEffPokemon } from './constants';

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

export type StatSortColumn =
  | 'name'
  | 'hp'
  | 'attack'
  | 'defense'
  | 'specialAttack'
  | 'specialDefense'
  | 'speed'
  | 'baseStatTotal'
  | 'pointValue';

/**
 * Normalizes Pokemon into the shape `StatTableColumn` consumes (each Pokemon
 * paired with its point value, if any) and sorts them by the requested column.
 *
 * `pointValue` is the only nullable column — a missing value is treated as a
 * fallback tier below every real value, so it sorts to the bottom in *both*
 * directions rather than flipping to the top on ASC. Ties always break on name
 * ascending so the order stays stable across every sort column.
 */
export function sortStatTablePokemon(
  pokemon: PokemonInput[],
  pointByPokemonId: Map<number, number>,
  sortBy: StatSortColumn,
  sortOrder: 'ASC' | 'DESC',
): StatTablePokemon[] {
  const rows: StatTablePokemon[] = pokemon.map((pkmn) => ({
    pokemon: pkmn,
    pointValue: pointByPokemonId.get(pkmn.id) ?? null,
  }));

  const direction = sortOrder === 'ASC' ? 1 : -1;

  return rows.sort((a, b) => {
    if (sortBy === 'pointValue') {
      if (a.pointValue === null && b.pointValue !== null) return 1;
      if (a.pointValue !== null && b.pointValue === null) return -1;
      if (a.pointValue !== null && b.pointValue !== null && a.pointValue !== b.pointValue) {
        return (a.pointValue - b.pointValue) * direction;
      }
    } else if (sortBy === 'name') {
      const byName = a.pokemon.name.localeCompare(b.pokemon.name);
      if (byName !== 0) return byName * direction;
    } else {
      const diff = a.pokemon[sortBy] - b.pokemon[sortBy];
      if (diff !== 0) return diff * direction;
    }
    return a.pokemon.name.localeCompare(b.pokemon.name);
  });
}
