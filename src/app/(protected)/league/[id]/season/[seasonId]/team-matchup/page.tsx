'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Route } from 'next';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  ErrorAlert,
  Select,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components';
import { PokemonModal } from '@/components/pokemon/PokemonModal';
import { useFetch } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { SeasonInput, PaginatedResponse, MoveInput, PokemonInput } from '@/types';
import { MOVES_PAGE_SIZE } from './constants';
import { useTeamData } from './useTeamData';
import {
  CoverageMovesContent,
  NoTeamSelected,
  SpecialMovesContent,
  SpeedTierColumn,
  TeamInfoColumn,
  TypeEffectivenessColumn,
} from './_components';

// localStorage keys
const LS_TAB_KEY = 'teamMatchup_tab';
const lsTeamKey = (leagueId: number, seasonId: number, side: 'teamAId' | 'teamBId') =>
  `teamMatchup_${leagueId}_${seasonId}_${side}`;

function TeamMatchupContent() {
  const params = useParams<{ id: string; seasonId: string }>();
  const leagueId = Number(params.id);
  const seasonId = Number(params.seasonId);

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Hydrate from localStorage on first render when query params are absent
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const hasTeamA = searchParams.has('teamAId');
    const hasTeamB = searchParams.has('teamBId');
    const hasTab = searchParams.has('tab');

    // Persist any query params that arrived in the URL
    if (hasTeamA) {
      localStorage.setItem(lsTeamKey(leagueId, seasonId, 'teamAId'), searchParams.get('teamAId')!);
    }
    if (hasTeamB) {
      localStorage.setItem(lsTeamKey(leagueId, seasonId, 'teamBId'), searchParams.get('teamBId')!);
    }
    if (hasTab) {
      localStorage.setItem(LS_TAB_KEY, searchParams.get('tab')!);
    }

    if (hasTeamA && hasTeamB && hasTab) return;

    const updates = new URLSearchParams(searchParams.toString());
    let changed = false;

    if (!hasTeamA) {
      const stored = localStorage.getItem(lsTeamKey(leagueId, seasonId, 'teamAId'));
      if (stored) {
        updates.set('teamAId', stored);
        changed = true;
      }
    }
    if (!hasTeamB) {
      const stored = localStorage.getItem(lsTeamKey(leagueId, seasonId, 'teamBId'));
      if (stored) {
        updates.set('teamBId', stored);
        changed = true;
      }
    }
    if (!hasTab) {
      const stored = localStorage.getItem(LS_TAB_KEY);
      if (stored) {
        updates.set('tab', stored);
        changed = true;
      }
    }

    if (changed) {
      const query = updates.toString();
      router.replace(`${pathname}${query ? `?${query}` : ''}` as Route, { scroll: false });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive state from URL (source of truth)
  const teamAId = searchParams.get('teamAId') ? Number(searchParams.get('teamAId')) : null;
  const teamBId = searchParams.get('teamBId') ? Number(searchParams.get('teamBId')) : null;
  const activeTab = searchParams.get('tab') ?? 'speed-tiers';

  const updateSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value !== null) params.set(key, value);
        else params.delete(key);
      }
      const query = params.toString();
      router.replace(`${pathname}${query ? `?${query}` : ''}` as Route, { scroll: false });

      // Persist selections to localStorage
      if ('teamAId' in updates) {
        const k = lsTeamKey(leagueId, seasonId, 'teamAId');
        updates.teamAId ? localStorage.setItem(k, updates.teamAId) : localStorage.removeItem(k);
      }
      if ('teamBId' in updates) {
        const k = lsTeamKey(leagueId, seasonId, 'teamBId');
        updates.teamBId ? localStorage.setItem(k, updates.teamBId) : localStorage.removeItem(k);
      }
      if ('tab' in updates) {
        updates.tab ? localStorage.setItem(LS_TAB_KEY, updates.tab) : localStorage.removeItem(LS_TAB_KEY);
      }
    },
    [searchParams, pathname, router, leagueId, seasonId],
  );

  const [modalPokemonId, setModalPokemonId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch season with teams
  const {
    data: season,
    loading: seasonLoading,
    error: seasonError,
  } = useFetch<SeasonInput>(
    buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'season', seasonId], { full: true }),
  );

  const teams = season?.teams ?? [];

  // Per-team data via shared hook
  const teamA = useTeamData(teamAId, leagueId);
  const teamB = useTeamData(teamBId, leagueId);

  // Fetch moves for all selected team Pokemon
  const allPokemonIds = useMemo(() => {
    const ids = [...teamA.rawPokemon, ...teamB.rawPokemon].map((p) => p.id);
    return ids.length > 0 ? ids : null;
  }, [teamA.rawPokemon, teamB.rawPokemon]);

  const movesUrl = allPokemonIds
    ? buildUrlWithQuery(BASE_ENDPOINTS.MOVE_BASE, [], {
        pokemonIds: allPokemonIds,
        full: true,
        pageSize: MOVES_PAGE_SIZE,
      })
    : null;
  const {
    data: movesData,
    loading: movesLoading,
    error: movesError,
  } = useFetch<PaginatedResponse<MoveInput>>(movesUrl);

  // Build pokemonId → MoveInput[] map from the moves response
  const pokemonMovesMap = useMemo(() => {
    const map = new Map<number, MoveInput[]>();
    if (!movesData) return map;
    const allIds = new Set(allPokemonIds ?? []);
    for (const move of movesData.data) {
      if (move.pokemon) {
        for (const pkmn of move.pokemon) {
          if (!allIds.has(pkmn.id)) continue;
          if (!map.has(pkmn.id)) {
            map.set(pkmn.id, []);
          }
          map.get(pkmn.id)!.push(move);
        }
      }
    }
    return map;
  }, [movesData, allPokemonIds]);

  // Enrich raw Pokemon with their moves
  const teamAWithMoves = useMemo<PokemonInput[]>(
    () =>
      teamA.rawPokemon.map((pkmn) => ({
        ...pkmn,
        moves: pokemonMovesMap.get(pkmn.id) ?? [],
      })),
    [teamA.rawPokemon, pokemonMovesMap],
  );

  const teamBWithMoves = useMemo<PokemonInput[]>(
    () =>
      teamB.rawPokemon.map((pkmn) => ({
        ...pkmn,
        moves: pokemonMovesMap.get(pkmn.id) ?? [],
      })),
    [teamB.rawPokemon, pokemonMovesMap],
  );

  const teamAName = useMemo(
    () => teams.find((t) => t.id === teamAId)?.name ?? 'Team A',
    [teams, teamAId],
  );
  const teamBName = useMemo(
    () => teams.find((t) => t.id === teamBId)?.name ?? 'Team B',
    [teams, teamBId],
  );

  const handleSpriteClick = useCallback((pokemonId: number) => {
    setModalPokemonId(pokemonId);
    setModalOpen(true);
  }, []);

  return (
    <div className="mx-auto max-w-7xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Team Matchup</h1>

      {seasonError && <ErrorAlert message={seasonError} />}

      {seasonLoading && (
        <div className="flex items-center justify-center py-10">
          <Spinner size={32} />
        </div>
      )}

      {season && (
        <div className="space-y-4">
          {/* Team selectors */}
          <div className="flex flex-wrap gap-4">
            <div className="w-64">
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Team A</label>
              <Select
                value={teamAId?.toString() ?? ''}
                onChange={(e) => {
                  const newId = e.target.value || null;
                  updateSearchParams({ teamAId: newId });
                }}
              >
                <option value="">Select a team...</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-64">
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Team B</label>
              <Select
                value={teamBId?.toString() ?? ''}
                onChange={(e) => {
                  const newId = e.target.value || null;
                  updateSearchParams({ teamBId: newId });
                }}
              >
                <option value="">Select a team...</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              updateSearchParams({
                tab: value !== 'speed-tiers' ? value : null,
              });
            }}
          >
            <TabsList>
              <TabsTrigger value="speed-tiers">Speed Tiers</TabsTrigger>
              <TabsTrigger value="team-info">Team Info</TabsTrigger>
              <TabsTrigger value="type-effectiveness">Type Effectiveness</TabsTrigger>
              <TabsTrigger value="special-moves">Special Moves</TabsTrigger>
              <TabsTrigger value="coverage-moves">Coverage Moves</TabsTrigger>
            </TabsList>

            {/* Speed Tiers tab */}
            <TabsContent value="speed-tiers">
              <Card>
                <CardContent className="pt-6">
                  {!teamAId && !teamBId ? (
                    <NoTeamSelected message="Select at least one team to view speed tiers." />
                  ) : (
                    <div className="flex gap-8">
                      {teamAId && (
                        <SpeedTierColumn
                          teamName={teamAName}
                          pokemon={teamA.speedTierPokemon}
                          loading={teamA.rosterLoading}
                          error={teamA.rosterError}
                          onSpriteClick={handleSpriteClick}
                        />
                      )}
                      {teamBId && (
                        <SpeedTierColumn
                          teamName={teamBName}
                          pokemon={teamB.speedTierPokemon}
                          loading={teamB.rosterLoading}
                          error={teamB.rosterError}
                          onSpriteClick={handleSpriteClick}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Team Info tab */}
            <TabsContent value="team-info">
              <Card>
                <CardContent className="pt-6">
                  {!teamAId && !teamBId ? (
                    <NoTeamSelected message="Select at least one team to view team info." />
                  ) : (
                    <div className="flex gap-8">
                      {teamAId && (
                        <TeamInfoColumn
                          team={teamA.teamFull}
                          teamPokemon={teamA.rosterData?.data ?? []}
                          gameStats={teamA.gameStats}
                          seasonTeams={teams}
                          loading={teamA.fullLoading || teamA.statsLoading}
                          error={teamA.fullError || teamA.statsError}
                          onSpriteClick={handleSpriteClick}
                        />
                      )}
                      {teamBId && (
                        <TeamInfoColumn
                          team={teamB.teamFull}
                          teamPokemon={teamB.rosterData?.data ?? []}
                          gameStats={teamB.gameStats}
                          seasonTeams={teams}
                          loading={teamB.fullLoading || teamB.statsLoading}
                          error={teamB.fullError || teamB.statsError}
                          onSpriteClick={handleSpriteClick}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Type Effectiveness tab */}
            <TabsContent value="type-effectiveness">
              <Card>
                <CardContent className="pt-6">
                  {!teamAId && !teamBId ? (
                    <NoTeamSelected message="Select at least one team to view type effectiveness." />
                  ) : (
                    <div className="flex gap-8">
                      {teamAId && (
                        <TypeEffectivenessColumn
                          teamName={teamAName}
                          pokemon={teamA.typeEffPokemon}
                          loading={teamA.rosterLoading}
                          error={teamA.rosterError}
                          onSpriteClick={handleSpriteClick}
                        />
                      )}
                      {teamBId && (
                        <TypeEffectivenessColumn
                          teamName={teamBName}
                          pokemon={teamB.typeEffPokemon}
                          loading={teamB.rosterLoading}
                          error={teamB.rosterError}
                          onSpriteClick={handleSpriteClick}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Special Moves tab */}
            <TabsContent value="special-moves">
              <Card>
                <CardContent className="pt-6">
                  {!teamAId && !teamBId ? (
                    <NoTeamSelected message="Select at least one team to view special moves." />
                  ) : (
                    <SpecialMovesContent
                      teamAName={teamAName}
                      teamBName={teamBName}
                      teamAPokemon={teamAWithMoves}
                      teamBPokemon={teamBWithMoves}
                      teamASelected={teamAId !== null}
                      teamBSelected={teamBId !== null}
                      loading={teamA.rosterLoading || teamB.rosterLoading || movesLoading}
                      error={teamA.rosterError || teamB.rosterError || movesError}
                      onSpriteClick={handleSpriteClick}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Coverage Moves tab */}
            <TabsContent value="coverage-moves">
              <Card>
                <CardContent className="pt-6">
                  {!teamAId && !teamBId ? (
                    <NoTeamSelected message="Select at least one team to view coverage moves." />
                  ) : (
                    <CoverageMovesContent
                      teamAName={teamAName}
                      teamBName={teamBName}
                      teamAPokemon={teamAWithMoves}
                      teamBPokemon={teamBWithMoves}
                      teamASelected={teamAId !== null}
                      teamBSelected={teamBId !== null}
                      loading={teamA.rosterLoading || teamB.rosterLoading || movesLoading}
                      error={teamA.rosterError || teamB.rosterError || movesError}
                      onSpriteClick={handleSpriteClick}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      <PokemonModal pokemonId={modalPokemonId} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}

export default function TeamMatchupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-10">
          <Spinner size={32} />
        </div>
      }
    >
      <TeamMatchupContent />
    </Suspense>
  );
}
