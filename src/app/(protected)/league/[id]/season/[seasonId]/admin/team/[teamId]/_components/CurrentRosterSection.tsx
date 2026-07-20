'use client';

import { useMemo, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, ErrorAlert, Spinner } from '@/components';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import { PokemonModal } from '@/components/pokemon/PokemonModal';
import { RemoveRosterEntryDialog } from './RemoveRosterEntryDialog';
import { useMutation, usePokemonModal } from '@/hooks';
import { LeagueApi } from '@/lib/api';
import type { SeasonPokemonInput } from '@/types';

interface CurrentRosterSectionProps {
  leagueId: number;
  teamId: number;
  data: SeasonPokemonInput[];
  loading: boolean;
  error: string | null;
  minRosterSize: number;
  maxRosterSize: number;
  pointLimit: number;
  onChanged: () => void;
}

function rosterCountBadge(count: number, min: number, max: number) {
  if (count > max) {
    return <Badge variant="destructive">{count} / {min}-{max} roster (over max)</Badge>;
  }
  if (count < min) {
    return (
      <Badge variant="warning">{count} / {min}-{max} roster (under min)</Badge>
    );
  }
  return <Badge variant="secondary">{count} / {min}-{max} roster</Badge>;
}

function pointTotalBadge(total: number, pointLimit: number) {
  if (total > pointLimit) {
    return <Badge variant="destructive">{total} / {pointLimit} pts (over limit)</Badge>;
  }
  return <Badge variant="secondary">{total} / {pointLimit} pts</Badge>;
}

export function CurrentRosterSection({
  leagueId,
  teamId,
  data,
  loading,
  error,
  minRosterSize,
  maxRosterSize,
  pointLimit,
  onChanged,
}: CurrentRosterSectionProps) {
  const [removeTarget, setRemoveTarget] = useState<SeasonPokemonInput | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { pokemonId: modalPokemonId, seasonPokemonId: modalSeasonPokemonId, open: modalOpen, openModal, onOpenChange } = usePokemonModal();

  const sortedRoster = useMemo(
    () => [...data].sort((a, b) => b.pointValue - a.pointValue),
    [data],
  );

  const totalPoints = useMemo(() => data.reduce((sum, sp) => sum + sp.pointValue, 0), [data]);

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
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
            <span>Current Roster</span>
            <div className="flex flex-wrap items-center gap-2">
              {loading && data.length === 0 ? (
                <Spinner size={16} />
              ) : (
                <>
                  {rosterCountBadge(data.length, minRosterSize, maxRosterSize)}
                  {pointTotalBadge(totalPoints, pointLimit)}
                </>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && <ErrorAlert message={error} />}

          {loading && data.length === 0 && (
            <div className="flex items-center justify-center py-10">
              <Spinner size={32} />
            </div>
          )}

          {!loading && sortedRoster.length === 0 && (
            <p className="text-sm text-muted-foreground">No Pokémon on this roster yet.</p>
          )}

          {sortedRoster.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {sortedRoster.map((sp) => {
                if (!sp.pokemon) return null;
                return (
                  <div
                    key={sp.id}
                    className="flex flex-col items-center gap-1 rounded-md border border-border p-2"
                  >
                    <PokemonSprite
                      pokemonId={sp.pokemon.id}
                      spriteUrl={sp.pokemon.spriteUrl}
                      name={sp.pokemon.name}
                      className="h-14 w-14 object-contain"
                      onClick={(id) => openModal(id, sp.id)}
                    />
                    <span className="text-center text-xs font-medium capitalize leading-tight">
                      {sp.pokemon.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{sp.pointValue} pts</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => openRemoveDialog(sp)}
                    >
                      Remove
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <PokemonModal
        pokemonId={modalPokemonId}
        open={modalOpen}
        onOpenChange={onOpenChange}
        seasonPokemonId={modalSeasonPokemonId}
        leagueId={leagueId}
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
