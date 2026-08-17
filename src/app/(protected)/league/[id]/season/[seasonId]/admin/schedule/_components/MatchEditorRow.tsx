'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button, ErrorAlert, Select, Spinner } from '@/components';
import { useMutation } from '@/hooks';
import { LeagueApi } from '@/lib/api';
import type { MatchInput, TeamInput } from '@/types';

interface MatchEditorRowProps {
  leagueId: number;
  match: MatchInput;
  teams: TeamInput[];
  onChanged: () => void;
}

export function MatchEditorRow({ leagueId, match, teams, onChanged }: MatchEditorRowProps) {
  const [editing, setEditing] = useState(false);
  const [teamAId, setTeamAId] = useState<number | ''>(match.teams?.[0]?.id ?? '');
  const [teamBId, setTeamBId] = useState<number | ''>(match.teams?.[1]?.id ?? '');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [displayA, displayB] = match.teams ?? [];
  const hasResult = match.winningTeamId != null && match.losingTeamId != null;

  const updateMutation = useMutation(
    (teamIds: number[]) => LeagueApi.updateMatch(leagueId, match.id, { teamIds }),
    {
      onSuccess: () => {
        setEditing(false);
        onChanged();
      },
    },
  );

  const deleteMutation = useMutation(() => LeagueApi.deleteMatch(leagueId, match.id), {
    onSuccess: () => {
      setDeleteOpen(false);
      onChanged();
    },
  });

  const canSave = teamAId !== '' && teamBId !== '' && teamAId !== teamBId;

  const handleStartEdit = () => {
    setTeamAId(match.teams?.[0]?.id ?? '');
    setTeamBId(match.teams?.[1]?.id ?? '');
    updateMutation.reset();
    setEditing(true);
  };

  return (
    <div className="rounded-md border border-border p-3">
      {!editing ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm">
            {displayA && displayB ? (
              <>
                {displayA.name} vs {displayB.name}
                <span className="ml-2 text-xs text-muted-foreground">
                  {hasResult
                    ? `${match.winningTeam?.name ?? 'Winner'} won`
                    : 'no result yet'}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">Teams not assigned yet</span>
            )}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={handleStartEdit}>
              Edit Teams
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={teamAId}
              onChange={(e) => setTeamAId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-auto"
            >
              <option value="">Team A</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
            <span className="text-sm text-muted-foreground">vs</span>
            <Select
              value={teamBId}
              onChange={(e) => setTeamBId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-auto"
            >
              <option value="">Team B</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
          {updateMutation.error && <ErrorAlert message={updateMutation.error} />}
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(false)}
              disabled={updateMutation.loading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => updateMutation.mutate([Number(teamAId), Number(teamBId)])}
              disabled={updateMutation.loading || !canSave}
            >
              {updateMutation.loading ? <Spinner size={14} /> : 'Save'}
            </Button>
          </div>
        </div>
      )}

      {deleteMutation.error && <ErrorAlert message={deleteMutation.error} />}

      <AlertDialog open={deleteOpen} onOpenChange={(open) => !open && setDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Match</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(undefined).catch(() => {})}
              disabled={deleteMutation.loading}
            >
              {deleteMutation.loading ? <Spinner size={14} /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
