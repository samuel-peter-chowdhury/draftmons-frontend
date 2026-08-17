'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import type { SeasonPokemonInput } from '@/types';

interface ExistingGameStat {
  seasonPokemonId: number;
  directKills: number;
  indirectKills: number;
  deaths: number;
}

interface ExistingGame {
  id: number;
  gameNumber: number;
  replayLink: string;
  winningTeamId: number;
  losingTeamId: number;
  differential: number;
  stats: ExistingGameStat[];
}

interface Team {
  teamId: number;
  teamName: string;
}

interface OverwriteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingGames: ExistingGame[];
  seasonPool: SeasonPokemonInput[];
  teams: Team[];
  onConfirm: () => void;
  confirming: boolean;
}

export function OverwriteDialog({
  open,
  onOpenChange,
  existingGames,
  seasonPool,
  teams,
  onConfirm,
  confirming,
}: OverwriteDialogProps) {
  function resolveTeamName(teamId: number): string {
    return teams.find((t) => t.teamId === teamId)?.teamName ?? `Team #${teamId}`;
  }

  function resolvePokemonName(seasonPokemonId: number): string {
    const sp = seasonPool.find((s) => s.id === seasonPokemonId);
    return sp?.pokemon?.name ?? `#${seasonPokemonId}`;
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Overwrite existing match results?</AlertDialogTitle>
          <AlertDialogDescription>
            This match already has recorded results. Submitting will permanently replace the
            following data:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="max-h-80 overflow-y-auto flex flex-col gap-4">
          {existingGames.map((game) => (
            <div key={game.id} className="text-sm">
              <p className="font-medium">
                Game {game.gameNumber} — {resolveTeamName(game.winningTeamId)} def.{' '}
                {resolveTeamName(game.losingTeamId)} (+{game.differential})
              </p>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                {game.stats.map((stat, i) => (
                  <li key={i}>
                    {resolvePokemonName(stat.seasonPokemonId)} — {stat.directKills}K /{' '}
                    {stat.indirectKills}iK / {stat.deaths}D
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Keep existing results</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: 'destructive' })}
            disabled={confirming}
            onClick={onConfirm}
          >
            Confirm Overwrite
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
