'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { Badge, Card, CardContent, ErrorAlert, Input, LeagueLogo, Skeleton, TeamLogo } from '@/components';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import type { ApiError } from '@/lib/api';
import { Api, buildUrlWithQuery, LeagueApi } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { computePokemonRanks, type PokemonRankRow } from '@/lib/pokemonStats';
import { computeStandings, type StandingsRow } from '@/lib/standings';
import { cn, formatSeasonStatus } from '@/lib/utils';
import type {
  LeagueInput,
  PaginatedResponse,
  SeasonInput,
  SeasonPokemonInput,
  TeamInput,
} from '@/types';

const SEARCH_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

function comparePokemonRankRows(a: PokemonRankRow, b: PokemonRankRow): number {
  return (
    b.totalKills - a.totalKills ||
    b.kda - a.kda ||
    b.avgKillsPerGame - a.avgKillsPerGame ||
    b.gamesPlayed - a.gamesPlayed
  );
}

interface PreviewState {
  loading: boolean;
  error: string | null;
  season: SeasonInput | null;
  standingsTop5: StandingsRow[];
  pokemonTop5: PokemonRankRow[];
}

const INITIAL_PREVIEW_STATE: PreviewState = {
  loading: false,
  error: null,
  season: null,
  standingsTop5: [],
  pokemonTop5: [],
};

function useLeaguePreview(leagueId: number | null): PreviewState {
  const [state, setState] = useState<PreviewState>(INITIAL_PREVIEW_STATE);

  useEffect(() => {
    if (!leagueId) {
      setState(INITIAL_PREVIEW_STATE);
      return;
    }

    let cancelled = false;

    async function load() {
      setState({ ...INITIAL_PREVIEW_STATE, loading: true });
      try {
        const seasonsResp = await LeagueApi.getSeasons(leagueId as number);
        if (cancelled) return;

        if (seasonsResp.data.length === 0) {
          setState({ ...INITIAL_PREVIEW_STATE, loading: false });
          return;
        }

        const latestSeason = seasonsResp.data.reduce((latest, s) => (s.id > latest.id ? s : latest));

        const [teamsResp, seasonPokemonResp] = await Promise.all([
          LeagueApi.getTeams(leagueId as number, {
            seasonId: latestSeason.id,
            full: true,
            pageSize: 100,
          }),
          Api.get<PaginatedResponse<SeasonPokemonInput>>(
            buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId as number, 'season-pokemon'], {
              seasonId: latestSeason.id,
              full: true,
              pageSize: 9999,
            }),
          ),
        ]);
        if (cancelled) return;

        const standingsTop5 = computeStandings(teamsResp.data).slice(0, 5);

        const { main, limited } = computePokemonRanks(
          seasonPokemonResp.data,
          new Map<number, TeamInput>(),
        );
        const pokemonTop5 = [...main, ...limited].sort(comparePokemonRankRows).slice(0, 5);

        setState({
          loading: false,
          error: null,
          season: latestSeason,
          standingsTop5,
          pokemonTop5,
        });
      } catch (e) {
        if (cancelled) return;
        const apiError = e as ApiError;
        setState((s) => ({
          ...s,
          loading: false,
          error: apiError?.body?.message || apiError?.message || 'Failed to load preview',
        }));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [leagueId]);

  return state;
}

interface LeagueSearchProps {
  variant: 'primary' | 'secondary';
}

export function LeagueSearch({ variant }: LeagueSearchProps) {
  const isPrimary = variant === 'primary';

  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<LeagueInput[]>([]);
  const [total, setTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<LeagueInput | null>(null);

  const preview = useLeaguePreview(selectedLeague?.id ?? null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setTotal(0);
      setSearchError(null);
      return;
    }

    setSearching(true);
    setSearchError(null);
    try {
      const response = await LeagueApi.getAll({
        nameLike: query,
        page: 1,
        pageSize: SEARCH_PAGE_SIZE,
      });
      setResults(response.data);
      setTotal(response.total);
    } catch (e) {
      const apiError = e as ApiError;
      setSearchError(apiError?.body?.message || apiError?.message || 'Search failed');
      setResults([]);
      setTotal(0);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(searchText), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText, search]);

  function handleSearchChange(value: string) {
    setSearchText(value);
    setSelectedLeague(null);
  }

  return (
    <div>
      <h2 className={isPrimary ? 'text-xl font-semibold' : 'text-base font-medium text-muted-foreground'}>
        {isPrimary ? 'Find a League' : 'Explore Other Leagues'}
      </h2>

      <Input
        value={searchText}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder="Search leagues by name…"
        className="mt-2 max-w-md"
        aria-label="Search leagues by name"
      />

      {searchError && (
        <div className="mt-2">
          <ErrorAlert message={searchError} />
        </div>
      )}

      {!searchError && searchText.trim() && !searching && results.length === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">No leagues found.</p>
      )}

      {results.length > 0 && (
        <div className="mt-2 max-w-md space-y-1">
          {results.map((league) => (
            <button
              key={league.id}
              type="button"
              onClick={() => setSelectedLeague(league)}
              className={cn(
                'w-full rounded-md border border-input px-3 py-2 text-left text-sm hover:bg-accent',
                selectedLeague?.id === league.id && 'border-primary bg-accent',
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                <LeagueLogo
                  logoUrl={league.logoUrl}
                  name={league.name}
                  className="h-4 w-4 object-contain"
                />
                <span>
                  {league.name}{' '}
                  <span className="text-muted-foreground">({league.abbreviation})</span>
                </span>
              </span>
            </button>
          ))}
          {total > SEARCH_PAGE_SIZE && (
            <p className="text-xs text-muted-foreground">
              Showing top {SEARCH_PAGE_SIZE} — refine your search for more specific results.
            </p>
          )}
        </div>
      )}

      {selectedLeague && (
        <Card className="mt-4 max-w-2xl">
          <CardContent className="space-y-4 p-4">
            {preview.loading && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-24 w-full" />
              </div>
            )}

            {preview.error && <ErrorAlert message={preview.error} />}

            {!preview.loading && !preview.error && !preview.season && (
              <p className="text-sm text-muted-foreground">This league has no seasons yet.</p>
            )}

            {!preview.loading && !preview.error && preview.season && (
              <>
                <div className="flex items-center gap-2">
                  <h3 className="flex items-center gap-1.5 font-semibold">
                    <LeagueLogo
                      logoUrl={selectedLeague.logoUrl}
                      name={selectedLeague.name}
                      className="h-5 w-5 object-contain"
                    />
                    {selectedLeague.name} — {preview.season.name}
                  </h3>
                  <Badge variant="secondary">{formatSeasonStatus(preview.season.status)}</Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-sm font-medium">Standings</p>
                    {preview.standingsTop5.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No games played yet this season.
                      </p>
                    ) : (
                      <ol className="space-y-1 text-sm">
                        {preview.standingsTop5.map((row, index) => (
                          <li key={row.team.id} className="flex items-center gap-1.5">
                            <span>{index + 1}.</span>
                            <TeamLogo
                              logoUrl={row.team.logoUrl}
                              name={row.team.name}
                              className="h-4 w-4 object-contain"
                            />
                            <span>
                              {row.team.name} ({row.matchWins}-{row.matchLosses})
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>

                  <div>
                    <p className="mb-1 text-sm font-medium">Pokemon Rank</p>
                    {preview.pokemonTop5.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No games played yet this season.
                      </p>
                    ) : (
                      <ol className="space-y-1 text-sm">
                        {preview.pokemonTop5.map((row, index) => {
                          const pkmn = row.seasonPokemon.pokemon!;
                          return (
                            <li key={row.seasonPokemon.id} className="flex items-center gap-2">
                              <span>{index + 1}.</span>
                              <PokemonSprite
                                pokemonId={pkmn.id}
                                spriteUrl={pkmn.spritePngUrl}
                                name={pkmn.name}
                                className="size-6 object-contain"
                                disableClick
                              />
                              <span className="capitalize">{pkmn.name}</span>
                              <span className="text-muted-foreground">{row.totalKills} kills</span>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 text-sm">
                  <Link
                    href={`/league/${selectedLeague.id}/season/${preview.season.id}/tiers`}
                    className="text-primary hover:underline"
                  >
                    Tier List
                  </Link>
                  <Link
                    href={`/league/${selectedLeague.id}/season/${preview.season.id}/team-matchup`}
                    className="text-primary hover:underline"
                  >
                    Team Matchup
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
