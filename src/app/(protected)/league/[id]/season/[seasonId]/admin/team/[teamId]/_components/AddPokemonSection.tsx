'use client';

import { useEffect, useState } from 'react';
import { Button, Card, CardContent, ErrorAlert, Spinner } from '@/components';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { PokemonFilterPanel } from '@/components/pokemon/PokemonFilterPanel';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import { ReassignConfirmDialog } from './ReassignConfirmDialog';
import { usePokemonSearch, useMutation } from '@/hooks';
import { LeagueApi } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { SeasonPokemonInput, SeasonPokemonTeamInput } from '@/types';

interface AddPokemonSectionProps {
  leagueId: number;
  teamId: number;
  seasonId: number;
  generationId: number | undefined;
  allowMultiTeamPokemon: boolean;
  /** Bump to force this section's search results to refetch (e.g. after a roster change elsewhere). */
  refreshKey: number;
  onChanged: () => void;
}

export function AddPokemonSection({
  leagueId,
  teamId,
  seasonId,
  generationId,
  allowMultiTeamPokemon,
  refreshKey,
  onChanged,
}: AddPokemonSectionProps) {
  const {
    data,
    loading,
    error,
    filters,
    types,
    specialMoveCategories,
    abilitySearchResults,
    moveSearchResults,
    abilitySearchLoading,
    moveSearchLoading,
    pageSize,
    resetGeneration,
    handleFilterChange,
    handlePageChange,
    handlePageSizeChange,
    setAbilitySearch,
    setMoveSearch,
  } = usePokemonSearch({
    endpoint: BASE_ENDPOINTS.SEASON_POKEMON_BASE,
    extraParams: { seasonId, full: true, _r: refreshKey },
    initialSortBy: 'name',
  });

  useEffect(() => {
    if (generationId) resetGeneration(generationId);
  }, [generationId, resetGeneration]);

  const [reassignTarget, setReassignTarget] = useState<{
    sp: SeasonPokemonInput;
    oldSpt: SeasonPokemonTeamInput;
  } | null>(null);

  const performAssign = async (sp: SeasonPokemonInput) => {
    const existingHere = sp.seasonPokemonTeams?.find((spt) => spt.teamId === teamId);
    if (existingHere) {
      await LeagueApi.updateSeasonPokemonTeam(leagueId, existingHere.id, { isActive: true });
    } else {
      await LeagueApi.createSeasonPokemonTeam(leagueId, { seasonPokemonId: sp.id, teamId });
    }
  };

  const assignMutation = useMutation((sp: SeasonPokemonInput) => performAssign(sp), {
    onSuccess: () => {
      onChanged();
    },
  });

  const reassignMutation = useMutation(
    async ({ sp, oldSptId, mode }: { sp: SeasonPokemonInput; oldSptId: number; mode: 'soft' | 'hard' }) => {
      if (mode === 'soft') {
        await LeagueApi.updateSeasonPokemonTeam(leagueId, oldSptId, { isActive: false });
      } else {
        await LeagueApi.deleteSeasonPokemonTeam(leagueId, oldSptId);
      }
      await performAssign(sp);
    },
    {
      onSuccess: () => {
        setReassignTarget(null);
        onChanged();
      },
    },
  );

  const handleAdd = (sp: SeasonPokemonInput) => {
    const activeElsewhere = sp.seasonPokemonTeams?.filter(
      (spt) => spt.teamId !== teamId && spt.isActive,
    );
    if (activeElsewhere && activeElsewhere.length > 0 && !allowMultiTeamPokemon) {
      reassignMutation.reset();
      setReassignTarget({ sp, oldSpt: activeElsewhere[0] });
      return;
    }
    assignMutation.reset();
    assignMutation.mutate(sp);
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        <h2 className="text-lg font-semibold">Add Pokémon</h2>

        <PokemonFilterPanel
          filters={filters}
          variant="seasonPokemon"
          onFilterChange={handleFilterChange}
          types={types}
          specialMoveCategories={specialMoveCategories}
          abilitySearchResults={abilitySearchResults}
          moveSearchResults={moveSearchResults}
          onAbilitySearchChange={setAbilitySearch}
          onMoveSearchChange={setMoveSearch}
          abilitySearchLoading={abilitySearchLoading}
          moveSearchLoading={moveSearchLoading}
        />

        {error && <ErrorAlert message={error} />}
        {assignMutation.error && <ErrorAlert message={assignMutation.error} />}

        {loading && !data && (
          <div className="flex items-center justify-center py-6">
            <Spinner size={28} />
          </div>
        )}

        {data && (
          <ul className="divide-y divide-border rounded-md border border-border">
            {data.data.length === 0 && (
              <li className="p-3 text-sm text-muted-foreground">No Pokémon found matching your filters.</li>
            )}
            {data.data.map((rawSp) => {
              const sp = rawSp as unknown as SeasonPokemonInput;
              const activeHere = sp.seasonPokemonTeams?.find(
                (spt) => spt.teamId === teamId && spt.isActive,
              );
              const activeElsewhere = sp.seasonPokemonTeams?.filter(
                (spt) => spt.teamId !== teamId && spt.isActive,
              );
              return (
                <li key={sp.id} className="flex items-center justify-between gap-3 p-2">
                  <div className="flex items-center gap-3">
                    {sp.pokemon && (
                      <PokemonSprite
                        pokemonId={sp.pokemon.id}
                        spriteUrl={sp.pokemon.spriteUrl}
                        name={sp.pokemon.name}
                        className="h-10 w-10 object-contain"
                        disableClick
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize">{sp.pokemon?.name}</span>
                        <span className="text-xs text-muted-foreground">{sp.pointValue} pts</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {activeElsewhere?.map((spt) => (
                          <Badge key={spt.id} variant="secondary">
                            Currently on: {spt.team?.name ?? 'Unknown team'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  {activeHere ? (
                    <Badge variant="outline">On this roster</Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleAdd(sp)}
                      disabled={assignMutation.loading}
                    >
                      {assignMutation.loading ? <Spinner size={16} /> : 'Add'}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {data && (
          <Pagination
            page={data.page}
            pageSize={pageSize}
            totalPages={data.totalPages}
            total={data.total}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            disabled={loading}
          />
        )}
      </CardContent>

      <ReassignConfirmDialog
        sp={reassignTarget?.sp ?? null}
        oldTeamName={reassignTarget?.oldSpt.team?.name}
        open={!!reassignTarget}
        onOpenChange={(open) => !open && setReassignTarget(null)}
        loading={reassignMutation.loading}
        error={reassignMutation.error}
        onConfirm={(mode) => {
          if (!reassignTarget) return;
          reassignMutation.mutate({
            sp: reassignTarget.sp,
            oldSptId: reassignTarget.oldSpt.id,
            mode,
          });
        }}
      />
    </Card>
  );
}
