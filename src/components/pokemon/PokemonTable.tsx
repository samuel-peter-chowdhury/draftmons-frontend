'use client';

import React, { useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent, ErrorAlert, Spinner, Pagination } from '@/components';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PokemonSprite } from './PokemonSprite';
import { PokemonModal } from './PokemonModal';
import { usePokemonModal } from '@/hooks';
import type { PaginatedResponse, PokemonInput, SeasonPokemonInput, SortableColumn } from '@/types';

function SortableHeader({
  column,
  sortBy,
  sortOrder,
  onSort,
  children,
}: {
  column: SortableColumn;
  sortBy: SortableColumn;
  sortOrder: 'ASC' | 'DESC';
  onSort: (column: SortableColumn) => void;
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

interface PokemonRow {
  pokemon: PokemonInput;
  pointValue?: number;
  seasonPokemonId?: number;
}

export type PokemonVariant = 'pokemon' | 'seasonPokemon';

export interface PokemonTableProps {
  data: PaginatedResponse<PokemonInput> | PaginatedResponse<SeasonPokemonInput> | null;
  variant: PokemonVariant;
  loading: boolean;
  error: string | null;
  sortBy: SortableColumn;
  sortOrder: 'ASC' | 'DESC';
  page: number;
  pageSize: number;
  onSort: (column: SortableColumn) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  leagueId?: number;
}

function getRowData(
  item: PokemonInput | SeasonPokemonInput,
  variant: PokemonVariant,
): PokemonRow | null {
  if (variant === 'pokemon') {
    return { pokemon: item as PokemonInput };
  }
  const seasonPokemon = item as SeasonPokemonInput;
  if (!seasonPokemon.pokemon) return null;
  return {
    pokemon: seasonPokemon.pokemon,
    pointValue: seasonPokemon.pointValue,
    seasonPokemonId: seasonPokemon.id,
  };
}

export function PokemonTable({
  data,
  variant,
  loading,
  error,
  sortBy,
  sortOrder,
  page,
  pageSize,
  onSort,
  onPageChange,
  onPageSizeChange,
  leagueId,
}: PokemonTableProps) {
  const pokemonModal = usePokemonModal();

  const handleSpriteClick = useCallback(
    (pokemonId: number, seasonPokemonId?: number) => {
      pokemonModal.openModal(pokemonId, seasonPokemonId);
    },
    [pokemonModal.openModal],
  );

  return (
    <>
      {error && <ErrorAlert message={error} />}

      {loading && !data && (
        <div className="flex items-center justify-center py-10">
          <Spinner size={32} />
        </div>
      )}

      {data && (
        <>
          <Card>
            <CardContent className="p-0">
              <div className={loading ? 'pointer-events-none opacity-50' : ''}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-20 w-20"></TableHead>
                      <TableHead>
                        <SortableHeader column="name" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort}>Name</SortableHeader>
                      </TableHead>
                      <TableHead>Types</TableHead>
                      <TableHead>Abilities</TableHead>
                      <TableHead>
                        <SortableHeader column="hp" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort}>HP</SortableHeader>
                      </TableHead>
                      <TableHead>
                        <SortableHeader column="attack" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort}>Atk</SortableHeader>
                      </TableHead>
                      <TableHead>
                        <SortableHeader column="defense" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort}>Def</SortableHeader>
                      </TableHead>
                      <TableHead>
                        <SortableHeader column="specialAttack" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort}>Sp.Atk</SortableHeader>
                      </TableHead>
                      <TableHead>
                        <SortableHeader column="specialDefense" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort}>Sp.Def</SortableHeader>
                      </TableHead>
                      <TableHead>
                        <SortableHeader column="speed" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort}>Spd</SortableHeader>
                      </TableHead>
                      <TableHead>
                        <SortableHeader column="baseStatTotal" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort}>BST</SortableHeader>
                      </TableHead>
                      {variant === 'seasonPokemon' && (
                          <TableHead>
                            <SortableHeader column="pointValue" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort}>Pts</SortableHeader>
                          </TableHead>
                        )
                      }
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={variant === 'seasonPokemon' ? 12 : 11} className="text-center text-muted-foreground">
                          No pokemon found matching your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.data.map((item) => {
                        const rowData = getRowData(item, variant);
                        if (!rowData) return null;
                        return (
                        <TableRow key={rowData.pokemon.id}>
                          <TableCell className="min-w-20 w-20">
                            <PokemonSprite
                              pokemonId={rowData.pokemon.id}
                              spriteUrl={rowData.pokemon.spriteUrl}
                              name={rowData.pokemon.name}
                              onClick={(id) =>
                                handleSpriteClick(id, rowData.seasonPokemonId)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium capitalize">{rowData.pokemon.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {rowData.pokemon.pokemonTypes.map((type) => (
                                <Badge
                                  key={type.id}
                                  className="capitalize"
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
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              <TooltipProvider delayDuration={100}>
                                {rowData.pokemon.abilities.map((ability) => (
                                  <Tooltip key={ability.id}>
                                    <TooltipTrigger asChild>
                                      <div>
                                        <Badge
                                          variant="secondary"
                                          className="cursor-help capitalize"
                                        >
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
                          </TableCell>
                          <TableCell>{rowData.pokemon.hp}</TableCell>
                          <TableCell>{rowData.pokemon.attack}</TableCell>
                          <TableCell>{rowData.pokemon.defense}</TableCell>
                          <TableCell>{rowData.pokemon.specialAttack}</TableCell>
                          <TableCell>{rowData.pokemon.specialDefense}</TableCell>
                          <TableCell>{rowData.pokemon.speed}</TableCell>
                          <TableCell className="font-medium">{rowData.pokemon.baseStatTotal}</TableCell>
                          {variant === 'seasonPokemon' && (
                            <TableCell>{rowData.pointValue}</TableCell>
                          )}
                        </TableRow>
                      )})
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Pagination
            page={data.page}
            pageSize={pageSize}
            totalPages={data.totalPages}
            total={data.total}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            disabled={loading}
            className="mt-4"
          />
        </>
      )}

      {pokemonModal.open && (
        <PokemonModal
          pokemonId={pokemonModal.pokemonId}
          open={pokemonModal.open}
          onOpenChange={pokemonModal.onOpenChange}
          seasonPokemonId={pokemonModal.seasonPokemonId}
          leagueId={leagueId}
        />
      )}
    </>
  );
}
