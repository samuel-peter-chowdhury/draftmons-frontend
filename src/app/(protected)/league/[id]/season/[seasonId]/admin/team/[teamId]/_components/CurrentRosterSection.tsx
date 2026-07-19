'use client';

import { useState } from 'react';
import { Button } from '@/components';
import { PokemonTable } from '@/components/pokemon/PokemonTable';
import { RemoveRosterEntryDialog } from './RemoveRosterEntryDialog';
import { useMutation } from '@/hooks';
import { LeagueApi } from '@/lib/api';
import type { PaginatedResponse, SeasonPokemonInput, SortableColumn } from '@/types';

interface CurrentRosterSectionProps {
  leagueId: number;
  teamId: number;
  data: PaginatedResponse<SeasonPokemonInput> | null;
  loading: boolean;
  error: string | null;
  sortBy: SortableColumn;
  sortOrder: 'ASC' | 'DESC';
  page: number;
  pageSize: number;
  onSort: (column: SortableColumn) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onChanged: () => void;
}

export function CurrentRosterSection({
  leagueId,
  teamId,
  data,
  loading,
  error,
  sortBy,
  sortOrder,
  page,
  pageSize,
  onSort,
  onPageChange,
  onPageSizeChange,
  onChanged,
}: CurrentRosterSectionProps) {
  const [removeTarget, setRemoveTarget] = useState<SeasonPokemonInput | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const softUnassignMutation = useMutation(
    (seasonPokemonTeamId: number) =>
      LeagueApi.updateSeasonPokemonTeam(leagueId, seasonPokemonTeamId, { isActive: false }),
    {
      onSuccess: () => {
        setDialogOpen(false);
        onChanged();
      },
    },
  );

  const hardDeleteMutation = useMutation(
    (seasonPokemonTeamId: number) => LeagueApi.deleteSeasonPokemonTeam(leagueId, seasonPokemonTeamId),
    {
      onSuccess: () => {
        setDialogOpen(false);
        onChanged();
      },
    },
  );

  const getSptId = (sp: SeasonPokemonInput) =>
    sp.seasonPokemonTeams?.find((spt) => spt.teamId === teamId)?.id;

  const openRemoveDialog = (sp: SeasonPokemonInput) => {
    setRemoveTarget(sp);
    softUnassignMutation.reset();
    hardDeleteMutation.reset();
    setDialogOpen(true);
  };

  const mutating = softUnassignMutation.loading || hardDeleteMutation.loading;

  return (
    <>
      <PokemonTable
        data={data}
        variant="seasonPokemon"
        loading={loading}
        error={error}
        sortBy={sortBy}
        sortOrder={sortOrder}
        page={page}
        pageSize={pageSize}
        onSort={onSort}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        leagueId={leagueId}
        rowActions={(sp) => (
          <Button variant="ghost" size="sm" onClick={() => openRemoveDialog(sp)}>
            Remove
          </Button>
        )}
      />

      <RemoveRosterEntryDialog
        sp={removeTarget}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        loading={mutating}
        error={softUnassignMutation.error || hardDeleteMutation.error}
        onSoftUnassign={() => {
          const sptId = removeTarget && getSptId(removeTarget);
          if (sptId) softUnassignMutation.mutate(sptId);
        }}
        onHardDelete={() => {
          const sptId = removeTarget && getSptId(removeTarget);
          if (sptId) hardDeleteMutation.mutate(sptId);
        }}
      />
    </>
  );
}
