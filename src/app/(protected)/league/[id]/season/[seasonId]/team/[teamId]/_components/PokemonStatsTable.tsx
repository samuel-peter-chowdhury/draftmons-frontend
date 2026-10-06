'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PokemonSprite,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components';
import type { PokemonStatRow } from '@/lib/teamStats';

type StatSortKey = 'gamesPlayed' | 'totalKills' | 'totalDeaths' | 'kda' | 'killsPerGame';

const COLUMNS: { key: StatSortKey; label: string; title: string }[] = [
  { key: 'gamesPlayed', label: 'G', title: 'Games played' },
  { key: 'totalKills', label: 'K', title: 'Kills (direct + indirect)' },
  { key: 'totalDeaths', label: 'D', title: 'Deaths' },
  { key: 'kda', label: 'KDA', title: 'Kills per death' },
  { key: 'killsPerGame', label: 'K/G', title: 'Kills per game' },
];

/** The sortable columns plus the leading Pokémon column. */
const COLUMN_COUNT = COLUMNS.length + 1;

function StatSortableHeader({
  column,
  sortBy,
  sortOrder,
  onSort,
  title,
  children,
}: {
  column: StatSortKey;
  sortBy: StatSortKey;
  sortOrder: 'ASC' | 'DESC';
  onSort: (column: StatSortKey) => void;
  title: string;
  children: ReactNode;
}) {
  const isActive = sortBy === column;
  return (
    <button
      onClick={() => onSort(column)}
      title={title}
      className="inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground"
    >
      {children}
      {isActive && sortOrder === 'ASC' && <ChevronUp className="size-4" />}
      {isActive && sortOrder === 'DESC' && <ChevronDown className="size-4" />}
      {!isActive && <div className="size-4" />}
    </button>
  );
}

interface PokemonStatsTableProps {
  rows: PokemonStatRow[];
  /** True while the roster-stats fetch is still in flight. */
  loading?: boolean;
  onSpriteClick: (pokemonId: number, seasonPokemonId: number) => void;
}

export function PokemonStatsTable({ rows, loading, onSpriteClick }: PokemonStatsTableProps) {
  const [sortBy, setSortBy] = useState<StatSortKey>('totalKills');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Client-side only: a roster is at most a dozen rows, so re-sorting never refetches.
  const handleSort = useCallback(
    (column: StatSortKey) => {
      if (sortBy === column) {
        setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
      } else {
        setSortBy(column);
        setSortOrder('DESC');
      }
    },
    [sortBy],
  );

  const sortedRows = useMemo(() => {
    const direction = sortOrder === 'ASC' ? 1 : -1;
    // Array#sort is stable, and `rows` arrive in `computePokemonStatRows` order — so
    // ties keep that chain and the default (totalKills DESC) is exactly the order
    // Top Performers shows.
    return [...rows].sort((a, b) => direction * (a[sortBy] - b[sortBy]));
  }, [rows, sortBy, sortOrder]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pokémon Stats</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Spinner size={20} />
          </div>
        ) : (
          <Table className="[&_td]:p-2 [&_th]:h-8 [&_th]:px-2 [&_th]:py-1">
            <TableHeader>
              <TableRow>
                <TableHead>Pokémon</TableHead>
                {COLUMNS.map(({ key, label, title }) => (
                  <TableHead key={key}>
                    <StatSortableHeader
                      column={key}
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                      title={title}
                    >
                      {label}
                    </StatSortableHeader>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COLUMN_COUNT} className="text-center text-muted-foreground">
                    No games played yet.
                  </TableCell>
                </TableRow>
              ) : (
                sortedRows.map((row) => (
                  <TableRow key={row.seasonPokemonId}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        <PokemonSprite
                          pokemonId={row.pokemon.id}
                          spriteUrl={row.pokemon.spritePngUrl}
                          name={row.pokemon.name}
                          className="size-8 shrink-0 object-contain"
                          onClick={(pokemonId) => onSpriteClick(pokemonId, row.seasonPokemonId)}
                        />
                        <span className="capitalize">{row.pokemon.name}</span>
                      </span>
                    </TableCell>
                    <TableCell>{row.gamesPlayed}</TableCell>
                    <TableCell>{row.totalKills}</TableCell>
                    <TableCell>{row.totalDeaths}</TableCell>
                    <TableCell>{row.kda.toFixed(2)}</TableCell>
                    <TableCell>{row.killsPerGame.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
