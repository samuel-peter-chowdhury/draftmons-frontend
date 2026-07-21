'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';

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
import { useFetch, usePokemonModal } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { computePokemonRanks, type PokemonRankRow } from '@/lib/pokemonStats';
import type { PaginatedResponse, SeasonPokemonInput, TeamInput } from '@/types';

function formatDecimal(value: number): string {
  return value.toFixed(2);
}

export default function SeasonPokemonRankPage() {
  const params = useParams<{ id: string; seasonId: string }>();
  const leagueId = Number(params.id);
  const seasonId = Number(params.seasonId);

  const { pokemonId: modalPokemonId, seasonPokemonId: modalSeasonPokemonId, open: modalOpen, openModal, onOpenChange } = usePokemonModal();

  const { data, loading, error } = useFetch<PaginatedResponse<SeasonPokemonInput>>(
    buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'season-pokemon'], {
      seasonId,
      full: true,
      pageSize: 9999,
    }),
  );

  const { data: teamsData } = useFetch<PaginatedResponse<TeamInput>>(
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

  function renderRows(rows: PokemonRankRow[]) {
    return rows.map((row, index) => {
      const pkmn = row.seasonPokemon.pokemon!;
      return (
        <TableRow key={row.seasonPokemon.id}>
          <TableCell>{index + 1}</TableCell>
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
              <span className="flex items-center gap-1.5">
                <TeamLogo
                  logoUrl={row.team.logoUrl}
                  name={row.team.name}
                  className="h-5 w-5 object-contain"
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
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Pokemon</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Games Played</TableHead>
                  <TableHead>Total Kills</TableHead>
                  <TableHead>Deaths</TableHead>
                  <TableHead>KDA</TableHead>
                  <TableHead>Avg Kills/Game</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderRows(main)}</TableBody>
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
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Pokemon</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Games Played</TableHead>
                    <TableHead>Total Kills</TableHead>
                    <TableHead>Deaths</TableHead>
                    <TableHead>KDA</TableHead>
                    <TableHead>Avg Kills/Game</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{renderRows(limited)}</TableBody>
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
