'use client';

import { useCallback, useMemo, type Dispatch, type SetStateAction } from 'react';

import { Card, CardContent, ErrorAlert, Spinner } from '@/components';
import { useFetch } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { PaginatedResponse, PokemonInput, SeasonPokemonInput } from '@/types';

import {
  buildSpByPokemonId,
  canRemove,
  decideTierAction,
  placeholderIdFor,
} from './rapidPlacement.utils';
import { RapidPlacementRow } from './RapidPlacementRow';

interface MutationLike<TVariables, TData> {
  mutate: (variables: TVariables) => Promise<TData>;
}

interface RapidPlacementViewProps {
  leagueId: number;
  seasonId: number;
  generationId: number;
  maxPointValue: number;
  spData: PaginatedResponse<SeasonPokemonInput> | null;
  setSpData: Dispatch<SetStateAction<PaginatedResponse<SeasonPokemonInput> | null>>;
  createMutation: MutationLike<
    { seasonId: number; pokemonId: number; pointValue: number },
    SeasonPokemonInput
  >;
  tierMutation: MutationLike<
    { spId: number; data: { pointValue: number } },
    SeasonPokemonInput
  >;
  deleteMutation: MutationLike<number, void>;
  // Owned by page.tsx, not this component: RapidPlacementView unmounts on every
  // Board/Rapid toggle, so component-local state would drop in-flight rows on
  // tab-switch (CR-01).
  pendingPokemonIds: Set<number>;
  setPendingPokemonIds: Dispatch<SetStateAction<Set<number>>>;
}

// Note: `leagueId` is accepted for interface symmetry with the page's other
// season-pokemon consumers, but is not read directly here — the three
// mutation props are already bound to `leagueId` by the page's `useMutation`
// factories, so this component never needs to reference it itself.
export function RapidPlacementView({
  seasonId,
  generationId,
  maxPointValue,
  spData,
  setSpData,
  createMutation,
  tierMutation,
  deleteMutation,
  pendingPokemonIds,
  setPendingPokemonIds,
}: RapidPlacementViewProps) {
  const {
    data: dexData,
    loading: dexLoading,
    error: dexError,
  } = useFetch<PaginatedResponse<PokemonInput>>(
    buildUrlWithQuery(BASE_ENDPOINTS.POKEMON_BASE, [], {
      generationIds: generationId,
      pageSize: 9999,
      sortBy: 'name',
      sortOrder: 'ASC',
    }),
  );

  const spByPokemonId = useMemo(() => buildSpByPokemonId(spData?.data ?? []), [spData]);

  const handleTierClick = useCallback(
    async (pokemonId: number, pointValue: number) => {
      if (pendingPokemonIds.has(pokemonId)) return;
      setPendingPokemonIds((prev) => new Set(prev).add(pokemonId));

      try {
        const existingSp = spByPokemonId.get(pokemonId);
        const action = decideTierAction(existingSp);

        if (action === 'update' && existingSp) {
          const previousPointValue = existingSp.pointValue;

          setSpData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              data: prev.data.map((item) =>
                item.id === existingSp.id ? { ...item, pointValue } : item,
              ),
            };
          });

          try {
            await tierMutation.mutate({ spId: existingSp.id, data: { pointValue } });
          } catch {
            setSpData((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                data: prev.data.map((item) =>
                  item.id === existingSp.id
                    ? { ...item, pointValue: previousPointValue }
                    : item,
                ),
              };
            });
          }
        } else {
          const dexPokemon = dexData?.data.find((p) => p.id === pokemonId);
          if (!dexPokemon) return;

          const placeholderId = placeholderIdFor(pokemonId);
          const now = new Date().toISOString();
          const placeholderSp: SeasonPokemonInput = {
            id: placeholderId,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            seasonId,
            pokemonId,
            pointValue,
            condition: '',
            pokemon: dexPokemon,
          };

          setSpData((prev) => {
            if (!prev) return prev;
            return { ...prev, data: [...prev.data, placeholderSp] };
          });

          try {
            const created = await createMutation.mutate({ seasonId, pokemonId, pointValue });
            setSpData((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                data: prev.data.map((item) =>
                  item.id === placeholderId ? { ...created, pokemon: dexPokemon } : item,
                ),
              };
            });
          } catch {
            setSpData((prev) => {
              if (!prev) return prev;
              return { ...prev, data: prev.data.filter((item) => item.id !== placeholderId) };
            });
          }
        }
      } finally {
        setPendingPokemonIds((prev) => {
          const next = new Set(prev);
          next.delete(pokemonId);
          return next;
        });
      }
    },
    [
      pendingPokemonIds,
      setPendingPokemonIds,
      spByPokemonId,
      dexData,
      seasonId,
      tierMutation,
      createMutation,
      setSpData,
    ],
  );

  const handleRemoveClick = useCallback(
    async (pokemonId: number) => {
      if (pendingPokemonIds.has(pokemonId)) return;

      const existingSp = spByPokemonId.get(pokemonId);
      if (!canRemove(existingSp) || !existingSp) return;

      setPendingPokemonIds((prev) => new Set(prev).add(pokemonId));

      const removedSp = existingSp;

      setSpData((prev) => {
        if (!prev) return prev;
        return { ...prev, data: prev.data.filter((item) => item.id !== removedSp.id) };
      });

      try {
        await deleteMutation.mutate(removedSp.id);
      } catch {
        setSpData((prev) => {
          if (!prev) return prev;
          return { ...prev, data: [...prev.data, removedSp] };
        });
      } finally {
        setPendingPokemonIds((prev) => {
          const next = new Set(prev);
          next.delete(pokemonId);
          return next;
        });
      }
    },
    [pendingPokemonIds, setPendingPokemonIds, spByPokemonId, deleteMutation, setSpData],
  );

  if (dexLoading && !dexData) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner size={32} />
      </div>
    );
  }

  if (dexError) {
    return <ErrorAlert message={dexError} />;
  }

  if (!dexData || dexData.data.length === 0) {
    return (
      <div className="py-10 text-center">
        <h2 className="text-sm font-medium">No Pokémon found for this generation</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          This season&apos;s generation has no Pokémon on record. Check the season&apos;s
          generation setting or contact an administrator.
        </p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div>
          {dexData.data.map((pokemon) => (
            <RapidPlacementRow
              key={pokemon.id}
              pokemon={pokemon}
              currentPointValue={spByPokemonId.get(pokemon.id)?.pointValue}
              maxPointValue={maxPointValue}
              disabled={pendingPokemonIds.has(pokemon.id)}
              onTierClick={(pointValue) => handleTierClick(pokemon.id, pointValue)}
              onRemoveClick={() => handleRemoveClick(pokemon.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
