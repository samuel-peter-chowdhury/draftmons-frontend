'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import {
  Card,
  CardContent,
  ErrorAlert,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TeamLogo,
} from '@/components';
import { PokemonModal } from '@/components/pokemon/PokemonModal';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import { useApiSWR, usePokemonModal } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import {
  computePokemonRanks,
  sortPokemonRankRows,
  type PokemonRankRow,
  type RankSortColumn,
} from '@/lib/pokemonStats';
import type { PaginatedResponse, SeasonPokemonInput, TeamInput } from '@/types';

function formatDecimal(value: number): string {
  return value.toFixed(2);
}

/**
 * Deliberately a third copy of a component that already exists in
 * `PokemonTable.tsx` (server-side sort) and `comparison/StatTableColumn.tsx`
 * (client-side sort). Extracting a shared version would put the Pokemon browse
 * table and the team-build compare page in the blast radius of a sorting
 * change to this one page.
 */
function SortableHeader({
  column,
  sortBy,
  sortOrder,
  onSort,
  children,
}: {
  column: RankSortColumn;
  sortBy: RankSortColumn;
  sortOrder: 'ASC' | 'DESC';
  onSort: (column: RankSortColumn) => void;
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
      {/* Reserves the chevron's width so header widths don't jump as the active column moves. */}
      {!isActive && <div className="h-4 w-4" />}
    </button>
  );
}

/** The seven sortable data columns, in display order. `#` is not sortable. */
const RANK_COLUMNS: { column: RankSortColumn; label: string }[] = [
  { column: 'name', label: 'Pokemon' },
  { column: 'team', label: 'Team' },
  { column: 'gamesPlayed', label: 'Games Played' },
  { column: 'totalKills', label: 'Total Kills' },
  { column: 'totalDeaths', label: 'Deaths' },
  { column: 'kda', label: 'KDA' },
  { column: 'avgKillsPerGame', label: 'Avg Kills/Game' },
];

/** Shared by the main and Limited Sample Size tables, which sort as one. */
function RankTableHeader({
  sortBy,
  sortOrder,
  onSort,
}: {
  sortBy: RankSortColumn;
  sortOrder: 'ASC' | 'DESC';
  onSort: (column: RankSortColumn) => void;
}) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>#</TableHead>
        {RANK_COLUMNS.map(({ column, label }) => (
          <TableHead
            key={column}
            aria-sort={
              sortBy === column ? (sortOrder === 'ASC' ? 'ascending' : 'descending') : undefined
            }
          >
            <SortableHeader column={column} sortBy={sortBy} sortOrder={sortOrder} onSort={onSort}>
              {label}
            </SortableHeader>
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

export default function SeasonPokemonRankPage() {
  const params = useParams<{ id: string; seasonId: string }>();
  const leagueId = Number(params.id);
  const seasonId = Number(params.seasonId);

  const { pokemonId: modalPokemonId, seasonPokemonId: modalSeasonPokemonId, open: modalOpen, openModal, onOpenChange } = usePokemonModal();

  const { data, loading, error } = useApiSWR<PaginatedResponse<SeasonPokemonInput>>(
    buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'season-pokemon'], {
      seasonId,
      full: true,
      pageSize: 9999,
    }),
  );

  const { data: teamsData } = useApiSWR<PaginatedResponse<TeamInput>>(
    buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'team'], {
      seasonId,
      pageSize: 100,
    }),
  );

  const teamsById = useMemo(() => {
    const map = new Map<number, TeamInput>();
    for (const team of teamsData?.data ?? []) map.set(team.id, team);
    return map;
  }, [teamsData]);

  const { main, limited, threshold } = useMemo(
    () => computePokemonRanks(data?.data ?? [], teamsById),
    [data, teamsById],
  );

  const hasAnyGames = main.length > 0 || limited.length > 0;

  // One sort pair drives both tables — they are one ranking split by sample
  // size, so a single control reads as one table with a divider. Held outside
  // the data memos so a SWR revalidation doesn't reset the user's choice.
  const [sortBy, setSortBy] = useState<RankSortColumn>('totalKills');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const handleSort = useCallback(
    (column: RankSortColumn) => {
      if (column === sortBy) {
        setSortOrder((o) => (o === 'ASC' ? 'DESC' : 'ASC'));
      } else {
        setSortBy(column);
        // Text columns open A→Z; numeric columns open highest-first.
        setSortOrder(column === 'name' || column === 'team' ? 'ASC' : 'DESC');
      }
    },
    [sortBy],
  );

  // Downstream of `computePokemonRanks`, never folded into it — that memo is
  // what stamps `rank`, and it must stay keyed only on the fetched data so the
  // frozen `#` survives a re-sort.
  const sortedMain = useMemo(
    () => sortPokemonRankRows(main, sortBy, sortOrder),
    [main, sortBy, sortOrder],
  );
  const sortedLimited = useMemo(
    () => sortPokemonRankRows(limited, sortBy, sortOrder),
    [limited, sortBy, sortOrder],
  );

  function renderRows(rows: PokemonRankRow[]) {
    return rows.map((row) => {
      const pkmn = row.seasonPokemon.pokemon!;
      return (
        <TableRow key={row.seasonPokemon.id}>
          <TableCell>{row.rank}</TableCell>
          <TableCell className="font-medium">
            <div className="flex items-center gap-2">
              <PokemonSprite
                pokemonId={pkmn.id}
                spriteUrl={pkmn.spritePngUrl}
                name={pkmn.name}
                className="h-8 w-8 object-contain"
                onClick={() => openModal(pkmn.id, row.seasonPokemon.id)}
              />
              <button
                className="capitalize hover:underline"
                onClick={() => openModal(pkmn.id, row.seasonPokemon.id)}
              >
                {pkmn.name}
              </button>
            </div>
          </TableCell>
          <TableCell>
            {row.team ? (
              <span className="flex items-center gap-2">
                <TeamLogo
                  logoUrl={row.team.logoUrl}
                  name={row.team.name}
                  className="h-7 w-7"
                />
                <Link
                  href={`/league/${leagueId}/season/${seasonId}/team/${row.team.id}`}
                  className="hover:underline"
                >
                  {row.team.name}
                </Link>
              </span>
            ) : (
              '—'
            )}
          </TableCell>
          <TableCell>{row.gamesPlayed}</TableCell>
          <TableCell>{row.totalKills}</TableCell>
          <TableCell>{row.totalDeaths}</TableCell>
          <TableCell>{formatDecimal(row.kda)}</TableCell>
          <TableCell>{formatDecimal(row.avgKillsPerGame)}</TableCell>
        </TableRow>
      );
    });
  }

  return (
    <div className="mx-auto max-w-7xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Pokemon Rankings</h1>

      {error && <ErrorAlert message={error} />}

      {loading && !data && (
        <div className="flex items-center justify-center py-10">
          <Spinner size={32} />
        </div>
      )}

      {data && !hasAnyGames && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No games recorded yet this season.
        </p>
      )}

      {main.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table className="[&_td]:p-2 [&_th]:h-8 [&_th]:px-2 [&_th]:py-1">
              <RankTableHeader sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              <TableBody>{renderRows(sortedMain)}</TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {limited.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Limited Sample Size</h2>
          <p className="mb-2 text-sm text-muted-foreground">
            Fewer than {threshold} games played — shown separately due to small sample size.
          </p>
          <Card>
            <CardContent className="p-0">
              <Table className="[&_td]:p-2 [&_th]:h-8 [&_th]:px-2 [&_th]:py-1">
                <RankTableHeader sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <TableBody>{renderRows(sortedLimited)}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      <PokemonModal
        pokemonId={modalPokemonId}
        open={modalOpen}
        onOpenChange={onOpenChange}
        seasonPokemonId={modalSeasonPokemonId}
        leagueId={leagueId}
      />
    </div>
  );
}
