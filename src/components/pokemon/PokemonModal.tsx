'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  ErrorAlert,
  Select,
  Spinner,
} from '@/components';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PokemonApi, PokemonMoveApi } from '@/lib/api';
import type { PokemonInput, PokemonMoveInput, PokemonTypeInput, SpecialMoveCategoryInput } from '@/types';

const NAT_DEX_NAME = 'nat_dex';

function formatGenerationName(name: string): string {
  return name
    .split('_')
    .map((word) => (word.length <= 2 ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
}

function capitalizeFirst(str: string): string {
  const lower = str.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

import { MoveCategory } from '@/types';

const CATEGORY_ORDER: MoveCategory[] = [MoveCategory.PHYSICAL, MoveCategory.SPECIAL, MoveCategory.STATUS];

interface MovesByCategory {
  category: MoveCategory;
  moves: PokemonMoveInput[];
}

interface MovesByType {
  pokemonType: PokemonTypeInput;
  categories: MovesByCategory[];
}

interface MovesBySpecialCategory {
  specialMoveCategory: SpecialMoveCategoryInput;
  categories: MovesByCategory[];
}

interface PokemonModalProps {
  pokemonId: number | null;
  generationId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STAT_LABELS: { key: keyof PokemonInput; label: string }[] = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: 'Attack' },
  { key: 'defense', label: 'Defense' },
  { key: 'specialAttack', label: 'Sp. Atk' },
  { key: 'specialDefense', label: 'Sp. Def' },
  { key: 'speed', label: 'Speed' },
];

const MAX_STAT = 255;

/**
 * Linearly interpolate between two values
 */
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Get the HSL color for a stat bar based on the stat value.
 * Uses continuous interpolation for smooth color transitions:
 * - 0-60: Red tones (hue 0-25)
 * - 61-100: Yellow/Orange tones (hue 25-55)
 * - 101-150: Green tones (hue 55-130)
 * - 151-255: Blue tones (hue 130-240, deepening)
 *
 * Saturation and lightness remain consistent for uniform vibrancy.
 */
function getStatColor(value: number): string {
  const saturation = 72;
  const lightness = 50;

  let hue: number;

  if (value <= 60) {
    // Red to orange-red: hue 0 → 25
    const t = value / 60;
    hue = lerp(0, 25, t);
  } else if (value <= 100) {
    // Orange to yellow: hue 25 → 55
    const t = (value - 60) / 40;
    hue = lerp(25, 55, t);
  } else if (value <= 150) {
    // Yellow-green to green: hue 55 → 130
    const t = (value - 100) / 50;
    hue = lerp(55, 130, t);
  } else {
    // Green-cyan to deep blue: hue 130 → 240
    // Use 255 as the upper bound but allow extrapolation for very high stats
    const t = Math.min((value - 150) / 105, 1.5);
    hue = lerp(130, 240, t);
  }

  return `hsl(${Math.round(hue)}, ${saturation}%, ${lightness}%)`;
}

export function PokemonModal({ pokemonId, generationId, open, onOpenChange }: PokemonModalProps) {
  const [pokemon, setPokemon] = useState<PokemonInput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generation state (only used when no generationId prop)
  const [selectedGenerationId, setSelectedGenerationId] = useState<number | null>(null);

  // Moves state
  const [moves, setMoves] = useState<PokemonMoveInput[]>([]);
  const [movesLoading, setMovesLoading] = useState(false);
  const [movesError, setMovesError] = useState<string | null>(null);

  const generations = (pokemon?.generations ?? []).slice().sort((a, b) => a.id - b.id);
  const effectiveGenerationId = generationId ?? selectedGenerationId;

  // Set default generation from pokemon data when it loads
  useEffect(() => {
    if (generationId != null || !pokemon?.generations?.length) return;
    const natDex = pokemon.generations.find((g) => g.name === NAT_DEX_NAME);
    if (natDex) {
      setSelectedGenerationId(natDex.id);
    } else {
      setSelectedGenerationId(pokemon.generations[0].id);
    }
  }, [pokemon, generationId]);

  // Fetch pokemon data
  useEffect(() => {
    if (open && pokemonId) {
      setLoading(true);
      setError(null);
      setPokemon(null);

      PokemonApi.getById(pokemonId, true)
        .then((data) => {
          setPokemon(data);
        })
        .catch((err) => {
          setError(err?.body?.message || err?.message || 'Failed to load Pokemon data');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, pokemonId]);

  // Fetch moves when pokemonId and generationId are available
  useEffect(() => {
    if (!open || !pokemonId || effectiveGenerationId == null) {
      setMoves([]);
      return;
    }

    setMovesLoading(true);
    setMovesError(null);

    PokemonMoveApi.getAll({
      pokemonId,
      generationId: effectiveGenerationId,
      full: true,
      pageSize: 1000,
      sortBy: 'moveId',
      sortOrder: 'ASC',
    })
      .then((res) => {
        setMoves(res.data);
      })
      .catch((err) => {
        setMovesError(err?.body?.message || err?.message || 'Failed to load moves');
      })
      .finally(() => {
        setMovesLoading(false);
      });
  }, [open, pokemonId, effectiveGenerationId]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setPokemon(null);
      setError(null);
      setMoves([]);
      setMovesError(null);
      setSelectedGenerationId(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl capitalize">
            {loading ? 'Loading...' : pokemon?.name || 'Pokemon'}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Spinner size={32} />
          </div>
        )}

        {error && <ErrorAlert message={error} />}

        {pokemon && !loading && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left column: Sprite and Types */}
              <div className="flex flex-col items-center gap-4">
                {pokemon.spriteUrl && (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <img
                          src={pokemon.spriteUrl}
                          alt={pokemon.name}
                          className="h-40 w-40 cursor-help object-contain"
                        />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm" side="right">
                        {pokemon.typeEffectiveness && pokemon.typeEffectiveness.length > 0 ? (() => {
                          const byValue = new Map<number, typeof pokemon.typeEffectiveness>();
                          for (const te of pokemon.typeEffectiveness!) {
                            const group = byValue.get(te.value);
                            if (group) {
                              group.push(te);
                            } else {
                              byValue.set(te.value, [te]);
                            }
                          }
                          const sorted = [...byValue.entries()].sort(([a], [b]) => b - a);

                          return (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold">Type Effectiveness</p>
                              <div className="space-y-2">
                                {sorted.map(([value, entries]) => (
                                  <div key={value}>
                                    <p className="mb-1 text-[11px] font-medium text-muted-foreground">{value}x</p>
                                    <div className="flex flex-wrap gap-1">
                                      {entries!.map((te) => (
                                          <Badge
                                            key={te.id}
                                            className="capitalize"
                                            style={{
                                              backgroundColor: te.pokemonType?.color ?? undefined,
                                              color: '#fff',
                                              border: 'none',
                                            }}
                                          >
                                            {te.pokemonType?.name}
                                          </Badge>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })() : (
                          <p className="text-xs text-muted-foreground">No type effectiveness data</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {/* Types */}
                <div className="flex flex-wrap justify-center gap-2">
                  {pokemon.pokemonTypes.map((type) => (
                    <Badge
                      key={type.id}
                      className="px-3 py-1 text-sm capitalize"
                      style={{
                        backgroundColor: type.color,
                        color: '#fff',
                        border: 'none',
                      }}
                    >
                      {type.name}
                    </Badge>
                  ))}
                </div>

                {/* Abilities */}
                <div className="w-full">
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">Abilities</h3>
                  <div className="flex flex-wrap gap-2">
                    <TooltipProvider delayDuration={100}>
                      {pokemon.abilities.map((ability) => (
                        <Tooltip key={ability.id}>
                          <TooltipTrigger asChild>
                            <div>
                              <Badge variant="secondary" className="cursor-help capitalize">
                                {ability.name}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="first-letter:capitalize">{ability.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>
                  </div>
                </div>
              </div>

              {/* Right column: Stats */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">Base Stats</h3>
                <div className="space-y-3">
                  <TooltipProvider delayDuration={100}>
                    {STAT_LABELS.map(({ key, label }) => {
                      const value = pokemon[key] as number;
                      const percentage = Math.min((value / MAX_STAT) * 100, 100);
                      const statColor = getStatColor(value);

                      const statRow = (
                        <div key={key} className={`flex items-center gap-3${key === 'speed' ? ' cursor-help' : ''}`}>
                          <span className="w-16 text-sm text-muted-foreground">{label}</span>
                          <span className="w-8 text-right text-sm font-medium">{value}</span>
                          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${percentage}%`, backgroundColor: statColor }}
                            />
                          </div>
                        </div>
                      );

                      if (key === 'speed') {
                        const maxNeutral = Math.floor(value * 2 + 99);
                        const maxPositive = Math.floor(maxNeutral * 1.1);
                        const maxPositivePlus1 = Math.floor(maxPositive * 1.5);

                        return (
                          <Tooltip key={key}>
                            <TooltipTrigger asChild>
                              <div>{statRow}</div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1 text-xs">
                                <p>Max Neutral: <span className="font-medium">{maxNeutral}</span></p>
                                <p>Max Positive: <span className="font-medium">{maxPositive}</span></p>
                                <p>Max Positive (+1): <span className="font-medium">{maxPositivePlus1}</span></p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      }

                      return statRow;
                    })}
                  </TooltipProvider>

                  {/* Base Stat Total */}
                  <div className="mt-4 flex items-center gap-3 border-t border-border pt-3">
                    <span className="w-16 text-sm font-medium">Total</span>
                    <span className="w-8 text-right text-sm font-bold">{pokemon.baseStatTotal}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Moves section */}
            <div>
              <div className="mb-3 flex items-center gap-3">
                <h3 className="text-sm font-medium text-muted-foreground">Moves</h3>
                {generationId == null && generations.length > 0 && (
                  <Select
                    className="h-8 w-auto text-xs"
                    value={selectedGenerationId ?? ''}
                    onChange={(e) => setSelectedGenerationId(Number(e.target.value))}
                  >
                    {generations.map((gen) => (
                      <option key={gen.id} value={gen.id}>
                        {formatGenerationName(gen.name)}
                      </option>
                    ))}
                  </Select>
                )}
              </div>

              {movesLoading && (
                <div className="flex items-center justify-center py-4">
                  <Spinner size={20} />
                </div>
              )}

              {movesError && <ErrorAlert message={movesError} />}

              {!movesLoading && !movesError && moves.length > 0 && (() => {
                // Group moves by special move category
                const specialGrouped: MovesBySpecialCategory[] = [];
                const specialMap = new Map<number, MovesBySpecialCategory>();

                for (const pm of moves) {
                  if (!pm.move?.specialMoveCategories) continue;
                  for (const smc of pm.move.specialMoveCategories) {
                    let smcGroup = specialMap.get(smc.id);
                    if (!smcGroup) {
                      smcGroup = { specialMoveCategory: smc, categories: [] };
                      specialMap.set(smc.id, smcGroup);
                      specialGrouped.push(smcGroup);
                    }
                    const catGroup = smcGroup.categories.find((c) => c.category === pm.move!.category);
                    if (catGroup) {
                      catGroup.moves.push(pm);
                    } else {
                      smcGroup.categories.push({ category: pm.move.category, moves: [pm] });
                    }
                  }
                }

                specialGrouped.sort((a, b) =>
                  a.specialMoveCategory.name.localeCompare(b.specialMoveCategory.name),
                );
                for (const smcGroup of specialGrouped) {
                  smcGroup.categories.sort(
                    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category),
                  );
                  for (const cat of smcGroup.categories) {
                    cat.moves.sort((a, b) => (a.move?.name ?? '').localeCompare(b.move?.name ?? ''));
                  }
                }

                // Group moves by pokemon type
                const grouped: MovesByType[] = [];
                const typeMap = new Map<number, MovesByType>();

                for (const pm of moves) {
                  if (!pm.move?.pokemonType) continue;
                  const typeId = pm.move.pokemonType.id;
                  let typeGroup = typeMap.get(typeId);
                  if (!typeGroup) {
                    typeGroup = { pokemonType: pm.move.pokemonType, categories: [] };
                    typeMap.set(typeId, typeGroup);
                    grouped.push(typeGroup);
                  }
                  const catGroup = typeGroup.categories.find((c) => c.category === pm.move!.category);
                  if (catGroup) {
                    catGroup.moves.push(pm);
                  } else {
                    typeGroup.categories.push({ category: pm.move.category, moves: [pm] });
                  }
                }

                // Sort type groups by name, categories by defined order, and moves by name
                grouped.sort((a, b) => a.pokemonType.name.localeCompare(b.pokemonType.name));
                for (const typeGroup of grouped) {
                  typeGroup.categories.sort(
                    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category),
                  );
                  for (const cat of typeGroup.categories) {
                    cat.moves.sort((a, b) => (a.move?.name ?? '').localeCompare(b.move?.name ?? ''));
                  }
                }

                return (
                  <div className="space-y-6">
                    <TooltipProvider delayDuration={100}>
                      {/* Moves by Special Move Category */}
                      {specialGrouped.length > 0 && (
                        <div className="space-y-4">
                          {specialGrouped.map(({ specialMoveCategory, categories: smcCategories }) => (
                            <div key={specialMoveCategory.id}>
                              <h4 className="mb-2 text-xs font-semibold capitalize text-foreground">
                                {specialMoveCategory.name}
                              </h4>
                              <div className="space-y-2 pl-2">
                                {smcCategories.map(({ category, moves: catMoves }) => (
                                  <div key={category}>
                                    <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                                      {capitalizeFirst(category)}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {catMoves.map((pm) => {
                                        const move = pm.move!;
                                        const typeColor = move.pokemonType?.color;
                                        return (
                                          <Tooltip key={pm.id}>
                                            <TooltipTrigger asChild>
                                              <div>
                                                <Badge
                                                  className="cursor-help capitalize"
                                                  style={{
                                                    backgroundColor: typeColor ?? undefined,
                                                    color: '#fff',
                                                    border: 'none',
                                                  }}
                                                >
                                                  {move.name}
                                                </Badge>
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                              <div className="space-y-1 text-xs">
                                                <p className="font-medium capitalize">{move.pokemonType?.name} &middot; {capitalizeFirst(move.category)}</p>
                                                {move.power > 0 && <p>Power: {move.power}</p>}
                                                {move.accuracy > 0 && <p>Accuracy: {move.accuracy}</p>}
                                                <p>PP: {move.pp}</p>
                                                {move.description && (
                                                  <p className="first-letter:capitalize">{move.description}</p>
                                                )}
                                              </div>
                                            </TooltipContent>
                                          </Tooltip>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {specialGrouped.length > 0 && (
                        <hr className="border-border" />
                      )}

                      {/* Moves by Type */}
                      {grouped.map(({ pokemonType, categories }) => (
                        <div key={pokemonType.id}>
                          <h4
                            className="mb-2 text-xs font-semibold capitalize"
                            style={{ color: pokemonType.color }}
                          >
                            {pokemonType.name}
                          </h4>
                          <div className="space-y-2 pl-2">
                            {categories.map(({ category, moves: catMoves }) => (
                              <div key={category}>
                                <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                                  {capitalizeFirst(category)}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {catMoves.map((pm) => {
                                    const move = pm.move!;
                                    return (
                                      <Tooltip key={pm.id}>
                                        <TooltipTrigger asChild>
                                          <div>
                                            <Badge
                                              className="cursor-help capitalize"
                                              style={{
                                                backgroundColor: pokemonType.color,
                                                color: '#fff',
                                                border: 'none',
                                              }}
                                            >
                                              {move.name}
                                            </Badge>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <div className="space-y-1 text-xs">
                                            <p className="font-medium capitalize">{pokemonType.name} &middot; {capitalizeFirst(move.category)}</p>
                                            {move.power > 0 && <p>Power: {move.power}</p>}
                                            {move.accuracy > 0 && <p>Accuracy: {move.accuracy}</p>}
                                            <p>PP: {move.pp}</p>
                                            {move.description && (
                                              <p className="first-letter:capitalize">{move.description}</p>
                                            )}
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </TooltipProvider>
                  </div>
                );
              })()}

              {!movesLoading && !movesError && moves.length === 0 && effectiveGenerationId != null && (
                <p className="text-sm text-muted-foreground">No moves found for this generation.</p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
