'use client';

import { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Card,
  CardContent,
  ErrorAlert,
  Spinner,
} from '@/components';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import { useFetch, useMutation } from '@/hooks';
import { buildUrlWithQuery, LeagueApi } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { PaginatedResponse, SeasonPokemonInput } from '@/types';

interface RosterHistorySectionProps {
  leagueId: number;
  teamId: number;
  seasonId: number;
  refreshKey: number;
  onChanged: () => void;
}

export function RosterHistorySection({
  leagueId,
  teamId,
  seasonId,
  refreshKey,
  onChanged,
}: RosterHistorySectionProps) {
  const url = buildUrlWithQuery(BASE_ENDPOINTS.SEASON_POKEMON_BASE, [], {
    teamId,
    seasonId,
    full: true,
    pageSize: 200,
    _r: refreshKey,
  });
  const { data, loading, error, refetch } = useFetch<PaginatedResponse<SeasonPokemonInput>>(url);

  const historyRows = useMemo(() => {
    return (data?.data ?? [])
      .map((sp) => ({
        sp,
        spt: sp.seasonPokemonTeams?.find((s) => s.teamId === teamId),
      }))
      .filter((row) => row.spt && row.spt.isActive === false);
  }, [data, teamId]);

  const [deleteTarget, setDeleteTarget] = useState<{ sp: SeasonPokemonInput; sptId: number } | null>(
    null,
  );

  const deleteMutation = useMutation(
    (sptId: number) => LeagueApi.deleteSeasonPokemonTeam(leagueId, sptId),
    {
      onSuccess: () => {
        setDeleteTarget(null);
        refetch();
        onChanged();
      },
    },
  );

  return (
    <Card>
      <CardContent className="p-0">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="history" className="border-b-0">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              Roster History {historyRows.length > 0 && `(${historyRows.length})`}
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              {loading && <Spinner size={20} />}
              {error && <ErrorAlert message={error} />}
              {!loading && historyRows.length === 0 && (
                <p className="text-sm text-muted-foreground">No dropped picks for this team.</p>
              )}
              {historyRows.length > 0 && (
                <ul className="space-y-2">
                  {historyRows.map(({ sp, spt }) => (
                    <li
                      key={sp.id}
                      className="flex items-center justify-between rounded-md border border-border p-2"
                    >
                      <div className="flex items-center gap-2">
                        {sp.pokemon && (
                          <PokemonSprite
                            pokemonId={sp.pokemon.id}
                            spriteUrl={sp.pokemon.spritePngUrl}
                            name={sp.pokemon.name}
                            className="h-8 w-8 object-contain"
                            disableClick
                          />
                        )}
                        <span className="text-sm capitalize">{sp.pokemon?.name}</span>
                        <span className="text-xs text-muted-foreground">{sp.pointValue} pts</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => spt && setDeleteTarget({ sp, sptId: spt.id })}
                      >
                        Delete permanently
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!deleteMutation.loading && !open) {
            setDeleteTarget(null);
            deleteMutation.reset();
          }
        }}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="capitalize">
              Permanently delete {deleteTarget?.sp.pokemon?.name}?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This removes the historical roster entry entirely. This action cannot be undone.
          </p>
          {deleteMutation.error && <ErrorAlert message={deleteMutation.error} />}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.sptId)}
              disabled={deleteMutation.loading}
            >
              {deleteMutation.loading ? <Spinner size={18} /> : 'Delete permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
