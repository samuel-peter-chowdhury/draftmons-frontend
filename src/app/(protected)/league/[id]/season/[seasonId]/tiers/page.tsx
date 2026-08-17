'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowRightLeft, ChevronUp, ChevronDown, Maximize2, Minimize2 } from 'lucide-react';
import { Button, Card, CardContent, ErrorAlert, Spinner } from '@/components';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import { PokemonModal } from '@/components/pokemon/PokemonModal';
import { useApiSWR, usePokemonModal } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { getStatColor, POKEMON_TYPE_ORDER } from '@/lib/pokemon';
import type { SeasonPokemonInput, PaginatedResponse, PokemonTypeInput } from '@/types';

type ViewMode = 'classic' | 'type';
type SortField = 'name' | 'speed' | 'pointValue';
type SortOrder = 'asc' | 'desc';

interface TierSort {
  field: SortField;
  order: SortOrder;
}

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

function SortIndicator({ field, sort }: { field: SortField; sort: TierSort }) {
  if (sort.field !== field) return <div className="h-3 w-3" />;
  return sort.order === 'asc' ? (
    <ChevronUp className="h-3 w-3" />
  ) : (
    <ChevronDown className="h-3 w-3" />
  );
}

export default function TierListPage() {
  const params = useParams<{ id: string; seasonId: string }>();
  const leagueId = Number(params.id);
  const seasonId = Number(params.seasonId);

  const [view, setView] = useState<ViewMode>('classic');
  const [classicSortMap, setClassicSortMap] = useState<Record<string, TierSort>>({});
  const [typeSortMap, setTypeSortMap] = useState<Record<string, TierSort>>({});
  // Held in state via a callback ref (not a plain ref) so the Pokemon modal's
  // portal container is guaranteed populated by the time the modal can open.
  const [fullscreenContainer, setFullscreenContainer] = useState<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const { pokemonId: modalPokemonId, seasonPokemonId: modalSeasonPokemonId, open: modalOpen, openModal, onOpenChange } = usePokemonModal();

  const sortMap = view === 'classic' ? classicSortMap : typeSortMap;
  const setSortMap = view === 'classic' ? setClassicSortMap : setTypeSortMap;

  const { data, loading, error } = useApiSWR<PaginatedResponse<SeasonPokemonInput>>(
    buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'season-pokemon'], {
      seasonId,
      full: true,
      activeRelationsOnly: true,
      pageSize: 9999,
    }),
  );

  const defaultSort: TierSort =
    view === 'classic' ? { field: 'name', order: 'asc' } : { field: 'pointValue', order: 'desc' };

  const valueColumn: SortField = view === 'classic' ? 'speed' : 'pointValue';
  const valueLabel = view === 'classic' ? 'Spd' : 'Pts';

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

  const handleSort = useCallback(
    (groupKey: string, field: SortField) => {
      setSortMap((prev) => {
        const current = prev[groupKey];
        if (current?.field === field) {
          return {
            ...prev,
            [groupKey]: { field, order: current.order === 'asc' ? 'desc' : 'asc' },
          };
        }
        const newOrder: SortOrder =
          field === 'name' ? 'asc' : field === 'pointValue' ? 'desc' : 'desc';
        return { ...prev, [groupKey]: { field, order: newOrder } };
      });
    },
    [setSortMap],
  );

  const getSortedPokemon = useCallback(
    (groupKey: string, pokemon: SeasonPokemonInput[]) => {
      const sort = sortMap[groupKey] ?? defaultSort;
      return [...pokemon].sort((a, b) => {
        let cmp: number;
        if (sort.field === 'name') {
          cmp = (a.pokemon?.name ?? '').localeCompare(b.pokemon?.name ?? '');
        } else if (sort.field === 'speed') {
          cmp = (a.pokemon?.speed ?? 0) - (b.pokemon?.speed ?? 0);
        } else {
          cmp = (a.pointValue ?? 0) - (b.pointValue ?? 0);
        }
        return sort.order === 'asc' ? cmp : -cmp;
      });
    },
    [sortMap, defaultSort],
  );

  const handleSpriteClick = useCallback(
    (pokemonId: number, seasonPokemonId?: number) => {
      openModal(pokemonId, seasonPokemonId);
    },
    [openModal],
  );

  const toggleView = useCallback(() => {
    setView((prev) => (prev === 'classic' ? 'type' : 'classic'));
  }, []);

  // Feature-detect after mount so SSR never touches `document`.
  useEffect(() => {
    setFullscreenSupported(typeof document.documentElement.requestFullscreen === 'function');
  }, []);

  // Listen on `document` rather than tracking state in the click handler, so the
  // icon also flips back when the user leaves fullscreen via the Esc key.
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === fullscreenContainer);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [fullscreenContainer]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else if (fullscreenContainer) {
      // Rejects when the browser refuses the request (e.g. no user gesture);
      // the `fullscreenchange` listener owns the success path.
      fullscreenContainer.requestFullscreen().catch(() => setIsFullscreen(false));
    }
  }, [fullscreenContainer]);

  return (
    <div className="p-4">
      {/* The table is self-evident, so the title only labels the states that
          render in place of it (loading / error / empty). */}
      {tiers.length === 0 && <h1 className="mb-4 text-2xl font-semibold">Tier List</h1>}

      {error && <ErrorAlert message={error} />}

      {loading && !data && (
        <div className="flex items-center justify-center py-10">
          <Spinner size={32} />
        </div>
      )}

      {data && tiers.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No Pokemon found for this season.
        </p>
      )}

      {tiers.length > 0 && (
        // The fullscreened element. Only this subtree stays visible while
        // fullscreen is active, so the toggle button and the Pokemon modal's
        // portal both have to live inside it.
        <div
          ref={setFullscreenContainer}
          className={`relative${isFullscreen ? ' bg-background' : ''}`}
        >
          {/* Floating controls. These live on the table rather than in a page
              header row so they cost no vertical space and stay reachable while
              fullscreen. */}
          {fullscreenSupported && (
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              className="absolute right-2 top-2 z-20 h-7 w-7 bg-card/80 text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground"
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleView}
            className="absolute bottom-2 right-2 z-20 h-7 gap-1.5 bg-card/80 px-2 text-xs text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            {view === 'classic' ? 'Type' : 'Classic'}
          </Button>

          <Card className={isFullscreen ? 'rounded-none border-0' : undefined}>
            <CardContent className="p-0">
              {/* Normal mode subtracts only the chrome that's actually there:
                  64px global header + 32px page p-4 + the Card's 2px border.
                  Fullscreen has no chrome at all, so it takes the full screen. */}
              <div
                className={`overflow-auto ${isFullscreen ? 'h-screen' : 'max-h-[calc(100vh-100px)]'}`}
              >
                <div className="flex">
                  {tiers.map((tier, idx) => {
                    const groupKey = String(tier.key);
                    const sort = sortMap[groupKey] ?? defaultSort;
                    const sorted = getSortedPokemon(groupKey, tier.pokemon);

                    return (
                      <div
                        key={tier.key}
                        className={`w-44 shrink-0${idx < tiers.length - 1 ? ' border-r border-border' : ''}`}
                      >
                        {/* Sticky header block */}
                        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-md">
                          {/* Group header */}
                          <div
                            className="border-b border-border bg-secondary/30 px-3 py-1.5 text-center text-sm font-bold capitalize"
                            style={tier.color ? { color: tier.color } : undefined}
                          >
                            {tier.label}
                          </div>

                          {/* Column headers */}
                          <div className="grid grid-cols-[36px_1fr_48px] items-center border-b border-border px-2 py-1">
                            <span />
                            <button
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                              onClick={() => handleSort(groupKey, 'name')}
                            >
                              Name
                              <SortIndicator field="name" sort={sort} />
                            </button>
                            <button
                              className="inline-flex items-center justify-end gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                              onClick={() => handleSort(groupKey, valueColumn)}
                            >
                              {valueLabel}
                              <SortIndicator field={valueColumn} sort={sort} />
                            </button>
                          </div>
                        </div>

                        {/* Pokemon rows */}
                        <div>
                          {sorted.map((sp) => {
                            const pkmn = sp.pokemon!;
                            const value = view === 'classic' ? pkmn.speed : (sp.pointValue ?? 0);
                            const isDrafted = (sp.seasonPokemonTeams?.length ?? 0) > 0;
                            return (
                              <div
                                key={sp.id}
                                className={`grid grid-cols-[36px_1fr_48px] items-center px-2 py-0.5 transition-colors hover:bg-secondary/50${isDrafted ? ' opacity-50' : ''}`}
                              >
                                <PokemonSprite
                                  pokemonId={pkmn.id}
                                  spriteUrl={pkmn.spritePngUrl}
                                  name={pkmn.name}
                                  className={`h-8 w-8 object-contain${isDrafted ? ' grayscale' : ''}`}
                                  onClick={(id) => handleSpriteClick(id, sp.id)}
                                />
                                <span
                                  className={`truncate pr-1 text-xs capitalize${isDrafted ? ' line-through text-muted-foreground' : ''}`}
                                >
                                  {pkmn.name}
                                </span>
                                <span
                                  className={`text-right text-xs font-semibold${isDrafted ? ' opacity-70' : ''}`}
                                  style={
                                    view === 'classic'
                                      ? { color: getStatColor(pkmn.speed) }
                                      : undefined
                                  }
                                >
                                  {value}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portaled into the fullscreen container unconditionally — DialogContent
              is position: fixed, so this has no visual effect outside fullscreen. */}
          <PokemonModal
            pokemonId={modalPokemonId}
            open={modalOpen}
            onOpenChange={onOpenChange}
            seasonPokemonId={modalSeasonPokemonId}
            leagueId={leagueId}
            container={fullscreenContainer}
          />
        </div>
      )}
    </div>
  );
}
