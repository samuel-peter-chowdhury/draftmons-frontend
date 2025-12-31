'use client';

import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button, Card, CardContent, ErrorAlert, Spinner } from '@/components';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { PaginatedResponse, PokemonInput } from '@/types';

type SortableColumn =
  | 'name'
  | 'hp'
  | 'attack'
  | 'defense'
  | 'specialAttack'
  | 'specialDefense'
  | 'speed'
  | 'baseStatTotal';

export interface PokemonTableProps {
  data: PaginatedResponse<PokemonInput> | null;
  loading: boolean;
  error: string | null;
  sortBy: SortableColumn;
  sortOrder: 'ASC' | 'DESC';
  page: number;
  onSort: (column: SortableColumn) => void;
  onPageChange: (page: number) => void;
}

export function PokemonTable({
  data,
  loading,
  error,
  sortBy,
  sortOrder,
  page,
  onSort,
  onPageChange,
}: PokemonTableProps) {
  const SortableHeader = ({
    column,
    children,
  }: {
    column: SortableColumn;
    children: React.ReactNode;
  }) => {
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
  };

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
                      <TableHead className="w-20"></TableHead>
                      <TableHead>
                        <SortableHeader column="name">Name</SortableHeader>
                      </TableHead>
                      <TableHead>Types</TableHead>
                      <TableHead>Abilities</TableHead>
                      <TableHead>
                        <SortableHeader column="hp">HP</SortableHeader>
                      </TableHead>
                      <TableHead>
                        <SortableHeader column="attack">Atk</SortableHeader>
                      </TableHead>
                      <TableHead>
                        <SortableHeader column="defense">Def</SortableHeader>
                      </TableHead>
                      <TableHead>
                        <SortableHeader column="specialAttack">Sp.Atk</SortableHeader>
                      </TableHead>
                      <TableHead>
                        <SortableHeader column="specialDefense">Sp.Def</SortableHeader>
                      </TableHead>
                      <TableHead>
                        <SortableHeader column="speed">Spd</SortableHeader>
                      </TableHead>
                      <TableHead>
                        <SortableHeader column="baseStatTotal">BST</SortableHeader>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-muted-foreground">
                          No pokemon found matching your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.data.map((pokemon) => (
                        <TableRow key={pokemon.id}>
                          <TableCell className="w-20">
                            {pokemon.spriteUrl ? (
                              <img
                                src={pokemon.spriteUrl}
                                alt={pokemon.name}
                                className="h-16 w-16 object-contain"
                              />
                            ) : (
                              <div className="h-16 w-16" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium capitalize">{pokemon.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {pokemon.pokemonTypes.map((type) => (
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
                              {pokemon.abilities.map((ability) => (
                                <Badge key={ability.id} variant="secondary" className="capitalize">
                                  {ability.name}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{pokemon.hp}</TableCell>
                          <TableCell>{pokemon.attack}</TableCell>
                          <TableCell>{pokemon.defense}</TableCell>
                          <TableCell>{pokemon.specialAttack}</TableCell>
                          <TableCell>{pokemon.specialDefense}</TableCell>
                          <TableCell>{pokemon.speed}</TableCell>
                          <TableCell className="font-medium">{pokemon.baseStatTotal}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              aria-label="Go to previous page"
            >
              Previous
            </Button>
            <div className="text-sm text-muted-foreground" role="status" aria-live="polite">
              Page {data.page} of {data.totalPages} • {data.total} total
            </div>
            <Button
              variant="outline"
              onClick={() => onPageChange(page < data.totalPages ? page + 1 : page)}
              disabled={page >= data.totalPages}
              aria-label="Go to next page"
            >
              Next
            </Button>
          </div>
        </>
      )}
    </>
  );
}
