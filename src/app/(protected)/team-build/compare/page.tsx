'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef } from 'react';
import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components';
import {
  CoverageMovesContent,
  MOVES_PAGE_SIZE,
  NoTeamSelected,
  SpecialMovesContent,
  SpeedTierColumn,
  TeamInfoColumn,
  TypeEffectivenessColumn,
} from '@/components/comparison';
import { PokemonModal } from '@/components/pokemon/PokemonModal';
import { useComparisonSide, useApiSWR, usePokemonModal } from '@/hooks';
import type { ComparisonSource } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { MoveInput, PaginatedResponse, PokemonInput } from '@/types';
import { SidePicker } from './_components/SidePicker';

const LS_TAB_KEY = 'teamBuildCompare_tab';
const LS_SIDE_A_KEY = 'teamBuildCompare_sideA';
const LS_SIDE_B_KEY = 'teamBuildCompare_sideB';

function parseSource(value: string | null): ComparisonSource | null {
  if (!value) return null;
  const parts = value.split(':');
  if (parts[0] === 'teamBuild' && parts[1]) {
    return { type: 'teamBuild', teamBuildId: Number(parts[1]) };
  }
  if (parts[0] === 'team' && parts[1] && parts[3]) {
    return { type: 'team', leagueId: Number(parts[1]), teamId: Number(parts[3]) };
  }
  return null;
}

function CompareContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Hydrate from localStorage on first render when query params are absent
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const hasA = searchParams.has('sideA');
    const hasB = searchParams.has('sideB');
    const hasTab = searchParams.has('tab');

    if (hasA) localStorage.setItem(LS_SIDE_A_KEY, searchParams.get('sideA')!);
    if (hasB) localStorage.setItem(LS_SIDE_B_KEY, searchParams.get('sideB')!);
    if (hasTab) localStorage.setItem(LS_TAB_KEY, searchParams.get('tab')!);

    if (hasA && hasB && hasTab) return;

    const updates = new URLSearchParams(searchParams.toString());
    let changed = false;
    if (!hasA) {
      const stored = localStorage.getItem(LS_SIDE_A_KEY);
      if (stored) {
        updates.set('sideA', stored);
        changed = true;
      }
    }
    if (!hasB) {
      const stored = localStorage.getItem(LS_SIDE_B_KEY);
      if (stored) {
        updates.set('sideB', stored);
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

  const sideAValue = searchParams.get('sideA');
  const sideBValue = searchParams.get('sideB');
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

      if ('sideA' in updates) {
        if (updates.sideA) localStorage.setItem(LS_SIDE_A_KEY, updates.sideA);
        else localStorage.removeItem(LS_SIDE_A_KEY);
      }
      if ('sideB' in updates) {
        if (updates.sideB) localStorage.setItem(LS_SIDE_B_KEY, updates.sideB);
        else localStorage.removeItem(LS_SIDE_B_KEY);
      }
      if ('tab' in updates) {
        if (updates.tab) localStorage.setItem(LS_TAB_KEY, updates.tab);
        else localStorage.removeItem(LS_TAB_KEY);
      }
    },
    [searchParams, pathname, router],
  );

  const sourceA = useMemo(() => parseSource(sideAValue), [sideAValue]);
  const sourceB = useMemo(() => parseSource(sideBValue), [sideBValue]);

  const sideA = useComparisonSide(sourceA);
  const sideB = useComparisonSide(sourceB);

  const {
    pokemonId: modalPokemonId,
    open: modalOpen,
    openModal,
    onOpenChange,
  } = usePokemonModal();

  const handleSpriteClick = useCallback(
    (pokemonId: number) => openModal(pokemonId),
    [openModal],
  );

  // Fetch moves for all selected Pokemon (both sides)
  const allPokemonIds = useMemo(() => {
    const ids = [...sideA.rawPokemon, ...sideB.rawPokemon].map((p) => p.id);
    return ids.length > 0 ? ids : null;
  }, [sideA.rawPokemon, sideB.rawPokemon]);

  const movesUrl = allPokemonIds
    ? buildUrlWithQuery(BASE_ENDPOINTS.MOVE_BASE, [], {
        pokemonIds: allPokemonIds,
        full: true,
        pageSize: MOVES_PAGE_SIZE,
      })
    : null;
  const { data: movesData, loading: movesLoading, error: movesError } =
    useApiSWR<PaginatedResponse<MoveInput>>(movesUrl);

  const pokemonMovesMap = useMemo(() => {
    const map = new Map<number, MoveInput[]>();
    if (!movesData) return map;
    const allIds = new Set(allPokemonIds ?? []);
    for (const move of movesData.data) {
      if (move.pokemon) {
        for (const pkmn of move.pokemon) {
          if (!allIds.has(pkmn.id)) continue;
          if (!map.has(pkmn.id)) map.set(pkmn.id, []);
          map.get(pkmn.id)!.push(move);
        }
      }
    }
    return map;
  }, [movesData, allPokemonIds]);

  const sideAWithMoves = useMemo<PokemonInput[]>(
    () => sideA.rawPokemon.map((pkmn) => ({ ...pkmn, moves: pokemonMovesMap.get(pkmn.id) ?? [] })),
    [sideA.rawPokemon, pokemonMovesMap],
  );
  const sideBWithMoves = useMemo<PokemonInput[]>(
    () => sideB.rawPokemon.map((pkmn) => ({ ...pkmn, moves: pokemonMovesMap.get(pkmn.id) ?? [] })),
    [sideB.rawPokemon, pokemonMovesMap],
  );

  const sideAName = sideA.label || 'Side A';
  const sideBName = sideB.label || 'Side B';

  const aSelected = sourceA !== null;
  const bSelected = sourceB !== null;

  const renderInfoColumn = (
    source: ComparisonSource | null,
    side: ReturnType<typeof useComparisonSide>,
  ) => {
    if (source?.type === 'team') {
      return (
        <TeamInfoColumn
          mode="team"
          team={side.teamFull}
          teamPokemon={side.rosterData?.data ?? []}
          gameStats={side.gameStats}
          seasonTeams={[]}
          loading={side.fullLoading || side.statsLoading}
          error={side.fullError || side.statsError}
          onSpriteClick={handleSpriteClick}
        />
      );
    }
    return (
      <TeamInfoColumn
        mode="teamBuild"
        teamBuild={side.teamBuild}
        pointTotal={side.pointTotal}
        loading={side.fullLoading}
        error={side.fullError}
      />
    );
  };

  return (
    <div className="mx-auto max-w-7xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Compare</h1>

      <div className="space-y-4">
        {/* Side pickers */}
        <div className="grid gap-4 sm:grid-cols-2">
          <SidePicker
            label="Side A"
            value={sideAValue}
            onChange={(v) => updateSearchParams({ sideA: v })}
          />
          <SidePicker
            label="Side B"
            value={sideBValue}
            onChange={(v) => updateSearchParams({ sideB: v })}
          />
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            updateSearchParams({ tab: value !== 'speed-tiers' ? value : null })
          }
        >
          <TabsList>
            <TabsTrigger value="speed-tiers">Speed Tiers</TabsTrigger>
            <TabsTrigger value="team-info">Team Info</TabsTrigger>
            <TabsTrigger value="type-effectiveness">Type Effectiveness</TabsTrigger>
            <TabsTrigger value="special-moves">Special Moves</TabsTrigger>
            <TabsTrigger value="coverage-moves">Coverage Moves</TabsTrigger>
          </TabsList>

          {/* Speed Tiers */}
          <TabsContent value="speed-tiers">
            <Card>
              <CardContent className="pt-6">
                {!aSelected && !bSelected ? (
                  <NoTeamSelected message="Select at least one side to view speed tiers." />
                ) : (
                  <div className="flex gap-8">
                    {aSelected && (
                      <SpeedTierColumn
                        teamName={sideAName}
                        pokemon={sideA.speedTierPokemon}
                        loading={sideA.rosterLoading}
                        error={sideA.rosterError}
                        onSpriteClick={handleSpriteClick}
                      />
                    )}
                    {bSelected && (
                      <SpeedTierColumn
                        teamName={sideBName}
                        pokemon={sideB.speedTierPokemon}
                        loading={sideB.rosterLoading}
                        error={sideB.rosterError}
                        onSpriteClick={handleSpriteClick}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Info */}
          <TabsContent value="team-info">
            <Card>
              <CardContent className="pt-6">
                {!aSelected && !bSelected ? (
                  <NoTeamSelected message="Select at least one side to view info." />
                ) : (
                  <div className="flex gap-8">
                    {aSelected && renderInfoColumn(sourceA, sideA)}
                    {bSelected && renderInfoColumn(sourceB, sideB)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Type Effectiveness */}
          <TabsContent value="type-effectiveness">
            <Card>
              <CardContent className="pt-6">
                {!aSelected && !bSelected ? (
                  <NoTeamSelected message="Select at least one side to view type effectiveness." />
                ) : (
                  <div className="flex gap-8">
                    {aSelected && (
                      <TypeEffectivenessColumn
                        teamName={sideAName}
                        pokemon={sideA.typeEffPokemon}
                        loading={sideA.rosterLoading}
                        error={sideA.rosterError}
                        onSpriteClick={handleSpriteClick}
                      />
                    )}
                    {bSelected && (
                      <TypeEffectivenessColumn
                        teamName={sideBName}
                        pokemon={sideB.typeEffPokemon}
                        loading={sideB.rosterLoading}
                        error={sideB.rosterError}
                        onSpriteClick={handleSpriteClick}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Special Moves */}
          <TabsContent value="special-moves">
            <Card>
              <CardContent className="pt-6">
                {!aSelected && !bSelected ? (
                  <NoTeamSelected message="Select at least one side to view special moves." />
                ) : (
                  <SpecialMovesContent
                    teamAName={sideAName}
                    teamBName={sideBName}
                    teamAPokemon={sideAWithMoves}
                    teamBPokemon={sideBWithMoves}
                    teamASelected={aSelected}
                    teamBSelected={bSelected}
                    loading={sideA.rosterLoading || sideB.rosterLoading || movesLoading}
                    error={sideA.rosterError || sideB.rosterError || movesError}
                    onSpriteClick={handleSpriteClick}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Coverage Moves */}
          <TabsContent value="coverage-moves">
            <Card>
              <CardContent className="pt-6">
                {!aSelected && !bSelected ? (
                  <NoTeamSelected message="Select at least one side to view coverage moves." />
                ) : (
                  <CoverageMovesContent
                    teamAName={sideAName}
                    teamBName={sideBName}
                    teamAPokemon={sideAWithMoves}
                    teamBPokemon={sideBWithMoves}
                    teamASelected={aSelected}
                    teamBSelected={bSelected}
                    loading={sideA.rosterLoading || sideB.rosterLoading || movesLoading}
                    error={sideA.rosterError || sideB.rosterError || movesError}
                    onSpriteClick={handleSpriteClick}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <PokemonModal pokemonId={modalPokemonId} open={modalOpen} onOpenChange={onOpenChange} />
    </div>
  );
}

export default function TeamBuildComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-10">
          <Spinner size={32} />
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
