'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { deriveDefaultTotalsSelection } from '@/components/comparison/derive';
import type { PokemonInput } from '@/types';

/**
 * Which Pokemon on one comparison side count toward that column's totals row.
 *
 * Owned by the comparison pages rather than the columns themselves: `TabsContent`
 * unmounts inactive tabs, so state living in a column would be lost on every tab
 * switch — at page level a single selection is shared by the Stat Table and Type
 * Effectiveness tabs.
 *
 * The default (top 6 by value) is re-derived only when the roster itself changes,
 * keyed on ids *and* point values. A background SWR revalidation that returns an
 * identical roster therefore leaves the user's manual picks alone, while switching
 * teams — or a trade, or an edited point value — resets to a fresh default.
 */
export function useTotalsSelection(
  pokemon: PokemonInput[],
  pointByPokemonId: Map<number, number>,
): {
  selectedIds: Set<number>;
  toggleSelected: (pokemonId: number) => void;
  resetSelection: () => void;
  isDefaultSelection: boolean;
} {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());

  const rosterKey = useMemo(
    () =>
      pokemon
        .map((p) => `${p.id}:${pointByPokemonId.get(p.id) ?? ''}`)
        .sort()
        .join(','),
    [pokemon, pointByPokemonId],
  );

  const defaultSelection = useMemo(
    () => deriveDefaultTotalsSelection(pokemon, pointByPokemonId),
    // Keyed on the roster rather than the array identity so a revalidation
    // returning equivalent data doesn't produce a new default reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rosterKey],
  );

  const lastRosterKey = useRef<string | null>(null);
  useEffect(() => {
    if (lastRosterKey.current === rosterKey) return;
    lastRosterKey.current = rosterKey;
    setSelectedIds(defaultSelection);
  }, [rosterKey, defaultSelection]);

  const toggleSelected = useCallback((pokemonId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (!next.delete(pokemonId)) next.add(pokemonId);
      return next;
    });
  }, []);

  const resetSelection = useCallback(() => {
    setSelectedIds(defaultSelection);
  }, [defaultSelection]);

  const isDefaultSelection =
    selectedIds.size === defaultSelection.size &&
    [...defaultSelection].every((id) => selectedIds.has(id));

  return { selectedIds, toggleSelected, resetSelection, isDefaultSelection };
}
