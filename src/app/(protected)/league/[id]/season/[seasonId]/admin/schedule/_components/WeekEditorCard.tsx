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
import type { TeamInput, WeekInput } from '@/types';

import { MatchEditorRow } from './MatchEditorRow';

interface WeekEditorCardProps {
  leagueId: number;
  week: WeekInput;
  teams: TeamInput[];
  onChanged: () => void;
}

export function WeekEditorCard({ leagueId, week, teams, onChanged }: WeekEditorCardProps) {
  const [teamAId, setTeamAId] = useState<number | ''>('');
  const [teamBId, setTeamBId] = useState<number | ''>('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const matches = week.matches ?? [];

  const addMatchMutation = useMutation(
    (teamIds: number[]) => LeagueApi.createMatch(leagueId, { weekId: week.id, teamIds }),
    {
      onSuccess: () => {
        setTeamAId('');
        setTeamBId('');
        onChanged();
      },
    },
  );

  const deleteWeekMutation = useMutation(() => LeagueApi.deleteWeek(leagueId, week.id), {
    onSuccess: () => {
      setDeleteOpen(false);
      onChanged();
    },
  });

  const canAddMatch = teamAId !== '' && teamBId !== '' && teamAId !== teamBId;

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium">{week.name}</h3>
        <Button size="sm" variant="destructive" onClick={() => setDeleteOpen(true)}>
          Delete Week
        </Button>
      </div>

      {deleteWeekMutation.error && <ErrorAlert message={deleteWeekMutation.error} />}

      <div className="flex flex-col gap-2">
        {matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matches yet.</p>
        ) : (
          matches.map((match) => (
            <MatchEditorRow
              key={match.id}
              leagueId={leagueId}
              match={match}
              teams={teams}
              onChanged={onChanged}
            />
          ))
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
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
        <Button
          size="sm"
          onClick={() => addMatchMutation.mutate([Number(teamAId), Number(teamBId)])}
          disabled={addMatchMutation.loading || !canAddMatch}
        >
          {addMatchMutation.loading ? <Spinner size={14} /> : 'Add Match'}
        </Button>
      </div>
      {addMatchMutation.error && <ErrorAlert message={addMatchMutation.error} />}

      <AlertDialog open={deleteOpen} onOpenChange={(open) => !open && setDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Week</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{week.name}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteWeekMutation.loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteWeekMutation.mutate(undefined).catch(() => {})}
              disabled={deleteWeekMutation.loading}
            >
              {deleteWeekMutation.loading ? <Spinner size={14} /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
