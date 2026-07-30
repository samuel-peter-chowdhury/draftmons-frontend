'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import {
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  ErrorAlert,
  Input,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components';
import { PokemonApi, LeagueApi } from '@/lib/api';
import { getStatColor, calculateSpeedTiers } from '@/lib/pokemon';
import type { PokemonInput, MoveInput, SeasonPokemonInput } from '@/types';

function capitalizeFirst(str: string): string {
  const lower = str.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

type MoveSortKey =
  | 'name'
  | 'pokemonType'
  | 'category'
  | 'power'
  | 'accuracy'
  | 'pp'
  | 'specialMoveCategories';

const MOVE_COLUMN_COUNT = 7;

function getSpecialCategoryNames(move: MoveInput): string {
  return (move.specialMoveCategories ?? []).map((smc) => smc.name).join(', ');
}

function getMoveSortValue(move: MoveInput, key: MoveSortKey): string | number {
  switch (key) {
    case 'pokemonType':
      return move.pokemonType?.name ?? '';
    case 'specialMoveCategories':
      return getSpecialCategoryNames(move);
    case 'name':
    case 'category':
      return move[key] ?? '';
    default:
      return move[key] ?? 0;
  }
}

function MoveSortableHeader({
  column,
  sortBy,
  sortOrder,
  onSort,
  children,
}: {
  column: MoveSortKey;
  sortBy: MoveSortKey;
  sortOrder: 'ASC' | 'DESC';
  onSort: (column: MoveSortKey) => void;
  children: React.ReactNode;
}) {
  const isActive = sortBy === column;
  return (
    <button
      onClick={() => onSort(column)}
      className="inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground"
    >
      {children}
      {isActive && sortOrder === 'ASC' && <ChevronUp className="h-4 w-4" />}
      {isActive && sortOrder === 'DESC' && <ChevronDown className="h-4 w-4" />}
      {!isActive && <div className="h-4 w-4" />}
    </button>
  );
}

interface PokemonModalProps {
  pokemonId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seasonPokemonId?: number | null;
  leagueId?: number;
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

export function PokemonModal({
  pokemonId,
  open,
  onOpenChange,
  seasonPokemonId,
  leagueId,
}: PokemonModalProps) {
  const [pokemon, setPokemon] = useState<PokemonInput | null>(null);
  const [seasonPokemon, setSeasonPokemon] = useState<SeasonPokemonInput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moveFilter, setMoveFilter] = useState('');
  const [moveSortBy, setMoveSortBy] = useState<MoveSortKey>('name');
  const [moveSortOrder, setMoveSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [expandedMoveIds, setExpandedMoveIds] = useState<Set<number>>(new Set());

  const moves = pokemon?.moves ?? [];

  // Filter by name, then sort — all client-side, moves are fully loaded in memory
  const visibleMoves = useMemo(() => {
    const filter = moveFilter.trim().toLowerCase();
    const filtered = filter
      ? moves.filter((move) => (move.name ?? '').toLowerCase().includes(filter))
      : moves;

    return [...filtered].sort((a, b) => {
      const aValue = getMoveSortValue(a, moveSortBy);
      const bValue = getMoveSortValue(b, moveSortBy);
      const comparison =
        typeof aValue === 'number' && typeof bValue === 'number'
          ? aValue - bValue
          : String(aValue).localeCompare(String(bValue));
      return moveSortOrder === 'ASC' ? comparison : -comparison;
    });
  }, [moves, moveFilter, moveSortBy, moveSortOrder]);

  const handleMoveSort = useCallback(
    (column: MoveSortKey) => {
      if (moveSortBy === column) {
        setMoveSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
      } else {
        setMoveSortBy(column);
        setMoveSortOrder('ASC');
      }
    },
    [moveSortBy],
  );

  const toggleMoveExpanded = useCallback((moveId: number) => {
    setExpandedMoveIds((prev) => {
      const next = new Set(prev);
      if (next.has(moveId)) {
        next.delete(moveId);
      } else {
        next.add(moveId);
      }
      return next;
    });
  }, []);

  // Fetch pokemon data (or season pokemon data when in season mode)
  useEffect(() => {
    if (!open || !pokemonId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setPokemon(null);
    setSeasonPokemon(null);
    setMoveFilter('');
    setMoveSortBy('name');
    setMoveSortOrder('ASC');
    setExpandedMoveIds(new Set());

    const fetches =
      seasonPokemonId && leagueId
        ? Promise.all([
            PokemonApi.getById(pokemonId, true),
            LeagueApi.getSeasonPokemonById(leagueId, seasonPokemonId, true, true),
          ]).then(([pokemonData, seasonData]) => {
            if (cancelled) return;
            setPokemon(pokemonData);
            setSeasonPokemon(seasonData);
          })
        : PokemonApi.getById(pokemonId, true).then((data) => {
            if (cancelled) return;
            setPokemon(data);
          });

    fetches
      .catch((err) => {
        if (cancelled) return;
        setError(err?.body?.message || err?.message || 'Failed to load Pokemon data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, pokemonId, leagueId, seasonPokemonId]);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setPokemon(null);
        setSeasonPokemon(null);
        setError(null);
      }
      onOpenChange(newOpen);
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
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
          // min-w-0 keeps this grid item from stretching to the moves table's natural
          // width, so the table's own overflow-auto wrapper scrolls instead of the modal
          <div className="min-w-0 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left column: Sprite and Types */}
              <div className="flex flex-col items-center gap-4">
                {pokemon.spriteGifUrl && (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <img
                          src={pokemon.spriteGifUrl}
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
                        const { maxNeutral, maxPositive, maxPositivePlus1 } =
                          calculateSpeedTiers(value);

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

            {/* Season info section */}
            {seasonPokemon && (
              <div className="flex items-start gap-6 rounded-lg bg-secondary/50 px-4 py-3">
                <div className="shrink-0">
                  <span className="text-xs font-medium text-muted-foreground">Pts</span>
                  <p className="text-sm">{seasonPokemon.pointValue}</p>
                </div>
                {seasonPokemon.condition && (
                  <div className="shrink-0">
                    <span className="text-xs font-medium text-muted-foreground">Condition</span>
                    <p className="text-sm">{seasonPokemon.condition}</p>
                  </div>
                )}
                {seasonPokemon.seasonPokemonTeams &&
                  seasonPokemon.seasonPokemonTeams.length > 0 && (
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-medium text-muted-foreground">Drafted By</span>
                      <p className="text-sm">
                        {seasonPokemon.seasonPokemonTeams
                          .filter((spt) => spt.team)
                          .map((spt) => spt.team!.name)
                          .join(', ')}
                      </p>
                    </div>
                  )}
              </div>
            )}

            {/* Moves section */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">Moves</h3>

              {moves.length > 0 && (
                <div className="space-y-3">
                  <Input
                    value={moveFilter}
                    onChange={(e) => setMoveFilter(e.target.value)}
                    placeholder="Filter moves by name..."
                    className="max-w-xs"
                  />

                  <Table className="[&_td]:p-2 [&_th]:h-8 [&_th]:px-2 [&_th]:py-1">
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <MoveSortableHeader column="name" sortBy={moveSortBy} sortOrder={moveSortOrder} onSort={handleMoveSort}>Name</MoveSortableHeader>
                        </TableHead>
                        <TableHead>
                          <MoveSortableHeader column="pokemonType" sortBy={moveSortBy} sortOrder={moveSortOrder} onSort={handleMoveSort}>Type</MoveSortableHeader>
                        </TableHead>
                        <TableHead>
                          <MoveSortableHeader column="category" sortBy={moveSortBy} sortOrder={moveSortOrder} onSort={handleMoveSort}>Category</MoveSortableHeader>
                        </TableHead>
                        <TableHead>
                          <MoveSortableHeader column="power" sortBy={moveSortBy} sortOrder={moveSortOrder} onSort={handleMoveSort}>Power</MoveSortableHeader>
                        </TableHead>
                        <TableHead>
                          <MoveSortableHeader column="accuracy" sortBy={moveSortBy} sortOrder={moveSortOrder} onSort={handleMoveSort}>Accuracy</MoveSortableHeader>
                        </TableHead>
                        <TableHead>
                          <MoveSortableHeader column="pp" sortBy={moveSortBy} sortOrder={moveSortOrder} onSort={handleMoveSort}>PP</MoveSortableHeader>
                        </TableHead>
                        <TableHead>
                          <MoveSortableHeader column="specialMoveCategories" sortBy={moveSortBy} sortOrder={moveSortOrder} onSort={handleMoveSort}>Special Category</MoveSortableHeader>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleMoves.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={MOVE_COLUMN_COUNT} className="text-center text-muted-foreground">
                            No moves match your filter.
                          </TableCell>
                        </TableRow>
                      ) : (
                        visibleMoves.map((move) => {
                          const expandable = Boolean(move.description);
                          const expanded = expandedMoveIds.has(move.id);
                          return (
                            <React.Fragment key={move.id}>
                              <TableRow
                                className={expandable ? 'cursor-pointer' : undefined}
                                onClick={expandable ? () => toggleMoveExpanded(move.id) : undefined}
                              >
                                <TableCell className="font-medium capitalize">{move.name}</TableCell>
                                <TableCell>
                                  <Badge
                                    className="capitalize"
                                    style={{
                                      backgroundColor: move.pokemonType?.color ?? undefined,
                                      color: '#fff',
                                      border: 'none',
                                    }}
                                  >
                                    {move.pokemonType?.name}
                                  </Badge>
                                </TableCell>
                                <TableCell>{capitalizeFirst(move.category)}</TableCell>
                                <TableCell>{move.power > 0 ? move.power : '—'}</TableCell>
                                <TableCell>{move.accuracy > 0 ? move.accuracy : '—'}</TableCell>
                                <TableCell>{move.pp}</TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {(move.specialMoveCategories ?? []).map((smc) => (
                                      <Badge key={smc.id} variant="secondary" className="capitalize">
                                        {smc.name}
                                      </Badge>
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                              {expandable && expanded && (
                                <TableRow>
                                  <TableCell colSpan={MOVE_COLUMN_COUNT} className="bg-muted/30">
                                    <p className="text-xs text-muted-foreground first-letter:capitalize">
                                      {move.description}
                                    </p>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {moves.length === 0 && !loading && (
                <p className="text-sm text-muted-foreground">No moves found for this Pokemon.</p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
