'use client';

import { useCallback, useMemo, useState } from 'react';
import { ArrowRightLeft, Check, Plus } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Card,
  ErrorAlert,
  Spinner,
} from '@/components';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import { useApiSWR } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { POKEMON_TYPE_ORDER } from '@/lib/pokemon';
import type {
  PaginatedResponse,
  PokemonTypeInput,
  SeasonPokemonInput,
  TeamBuildInput,
} from '@/types';

type ViewMode = 'classic' | 'type';

interface ClassicGroup {
  key: number;
  label: string;
  color?: undefined;
  pokemon: SeasonPokemonInput[];
}

interface TypeGroup {
  key: string;
  label: string;
  color: string;
  pokemon: SeasonPokemonInput[];
}

type TierGroup = ClassicGroup | TypeGroup;

interface TeamBuildTierBrowserProps {
  build: TeamBuildInput;
  existingPokemonIds: Set<number>;
  addingIds: Set<number>;
  onAdd: (payload: { pokemonId: number; pointValue?: number | null; condition?: string | null }) => void;
  onSpriteClick: (pokemonId: number, seasonPokemonId?: number) => void;
}

/**
 * Embedded, compact tier-list browser for adding Pokemon to a season-linked
 * build without leaving Draft Prep. Deliberately duplicates the grouping logic
 * of `league/[id]/season/[seasonId]/tiers/page.tsx` rather than extracting a
 * shared hook — that page is out of scope for this pass.
 *
 * The season pool is expensive (full relations for up to 9999 rows), so the
 * whole section is collapsed on mount and the request URL stays `null` until
 * the user expands it for the first time.
 */
export function TeamBuildTierBrowser({
  build,
  existingPokemonIds,
  addingIds,
  onAdd,
  onSpriteClick,
}: TeamBuildTierBrowserProps) {
  const [opened, setOpened] = useState(false);
  const [view, setView] = useState<ViewMode>('classic');

  const leagueId = build.season?.leagueId;

  // Parameters (and their order) match tiers/page.tsx byte-for-byte so the two
  // views share one SWR cache key instead of re-shipping the season pool.
  const url = !opened
    ? null
    : leagueId != null
      ? buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'season-pokemon'], {
          seasonId: build.seasonId,
          full: true,
          activeRelationsOnly: true,
          pageSize: 9999,
        })
      : buildUrlWithQuery(BASE_ENDPOINTS.SEASON_POKEMON_BASE, [], {
          seasonId: build.seasonId,
          full: true,
          activeRelationsOnly: true,
          pageSize: 9999,
        });

  const { data, loading, error } = useApiSWR<PaginatedResponse<SeasonPokemonInput>>(url);

  const classicTiers = useMemo<ClassicGroup[]>(() => {
    if (!data?.data) return [];
    const groups = new Map<number, SeasonPokemonInput[]>();
    for (const sp of data.data) {
      if (!sp.pokemon) continue;
      const pv = sp.pointValue ?? 0;
      const group = groups.get(pv);
      if (group) group.push(sp);
      else groups.set(pv, [sp]);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => b - a)
      .map(([pointValue, pokemon]) => ({
        key: pointValue,
        label: String(pointValue),
        pokemon,
      }));
  }, [data]);

  const typeTiers = useMemo<TypeGroup[]>(() => {
    if (!data?.data) return [];
    const groups = new Map<string, { type: PokemonTypeInput; pokemon: SeasonPokemonInput[] }>();
    for (const sp of data.data) {
      if (!sp.pokemon?.pokemonTypes) continue;
      for (const pt of sp.pokemon.pokemonTypes) {
        const key = pt.name.toLowerCase();
        const existing = groups.get(key);
        if (existing) existing.pokemon.push(sp);
        else groups.set(key, { type: pt, pokemon: [sp] });
      }
    }
    return POKEMON_TYPE_ORDER.filter((name) => groups.has(name)).map((name) => {
      const { type, pokemon } = groups.get(name)!;
      return {
        key: name,
        label: name.charAt(0).toUpperCase() + name.slice(1),
        color: type.color,
        pokemon,
      };
    });
  }, [data]);

  const tiers: TierGroup[] = view === 'classic' ? classicTiers : typeTiers;

  // Every group starts expanded — one click should land the user on a fully
  // browsable list. Fixed name-ascending order inside each group; this is an
  // add-Pokemon tool, not an analysis view.
  const groupKeys = useMemo(() => tiers.map((tier) => String(tier.key)), [tiers]);

  const sortedGroups = useMemo(
    () =>
      tiers.map((tier) => ({
        ...tier,
        pokemon: [...tier.pokemon].sort((a, b) =>
          (a.pokemon?.name ?? '').localeCompare(b.pokemon?.name ?? ''),
        ),
      })),
    [tiers],
  );

  const toggleView = useCallback(() => {
    setView((prev) => (prev === 'classic' ? 'type' : 'classic'));
  }, []);

  return (
    <Card>
      <Accordion
        type="single"
        collapsible
        onValueChange={(value) => {
          if (value) setOpened(true);
        }}
      >
        <AccordionItem value="tier-browser" className="border-b-0">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            Tier List
          </AccordionTrigger>
          <AccordionContent className="px-4">
            <div className="mb-2 flex items-center justify-end">
              <Button variant="ghost" size="sm" onClick={toggleView} className="h-7 gap-1.5 text-xs">
                <ArrowRightLeft className="h-3.5 w-3.5" />
                {view === 'classic' ? 'Type' : 'Classic'}
              </Button>
            </div>

            {error && <ErrorAlert message={error} />}

            {loading && !data && (
              <div className="flex items-center justify-center py-6">
                <Spinner size={24} />
              </div>
            )}

            {data && sortedGroups.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No Pokémon found for this season.
              </p>
            )}

            {/* `defaultValue` is only read on mount, so the inner accordion is keyed
                on `view` — a remount keeps every group of the newly-selected
                grouping expanded. */}
            {sortedGroups.length > 0 && (
              <Accordion key={view} type="multiple" defaultValue={groupKeys} className="w-full">
                {sortedGroups.map((tier) => (
                  <AccordionItem key={tier.key} value={String(tier.key)}>
                    <AccordionTrigger className="py-2 text-xs hover:no-underline">
                      <span className="flex items-center gap-2">
                        <span
                          className="font-bold capitalize"
                          style={tier.color ? { color: tier.color } : undefined}
                        >
                          {tier.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {tier.pokemon.length}
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-2">
                      <div>
                        {tier.pokemon.map((sp) => {
                          const pkmn = sp.pokemon!;
                          const isDrafted = (sp.seasonPokemonTeams?.length ?? 0) > 0;
                          const alreadyAdded = existingPokemonIds.has(pkmn.id);
                          const adding = addingIds.has(pkmn.id);
                          return (
                            <div
                              key={sp.id}
                              className={`flex h-7 items-center gap-2 rounded-md px-1 transition-colors hover:bg-secondary/50${isDrafted ? ' opacity-50' : ''}`}
                            >
                              <PokemonSprite
                                pokemonId={pkmn.id}
                                spriteUrl={pkmn.spritePngUrl}
                                name={pkmn.name}
                                className={`h-6 w-6 object-contain${isDrafted ? ' grayscale' : ''}`}
                                onClick={(id) => onSpriteClick(id, sp.id)}
                              />
                              <span
                                className={`flex-1 truncate text-xs capitalize${isDrafted ? ' text-muted-foreground line-through' : ''}`}
                              >
                                {pkmn.name}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                disabled={alreadyAdded || adding}
                                onClick={() =>
                                  onAdd({
                                    pokemonId: pkmn.id,
                                    pointValue: sp.pointValue,
                                    condition: sp.condition,
                                  })
                                }
                                aria-label={
                                  alreadyAdded
                                    ? `${pkmn.name} is already in this build`
                                    : `Add ${pkmn.name} to this build`
                                }
                              >
                                {adding ? (
                                  <Spinner size={12} />
                                ) : alreadyAdded ? (
                                  <Check className="h-3.5 w-3.5" />
                                ) : (
                                  <Plus className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
