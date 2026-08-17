'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, ErrorAlert, Input, Spinner } from '@/components';
import { useMutation } from '@/hooks';
import { LeagueApi } from '@/lib/api';
import type { TeamInput, WeekInput } from '@/types';

import { WeekEditorCard } from './WeekEditorCard';

interface ManualScheduleEditorProps {
  leagueId: number;
  seasonId: number;
  teams: TeamInput[];
  weeks: WeekInput[];
  loading: boolean;
  onChanged: () => void;
}

export function ManualScheduleEditor({
  leagueId,
  seasonId,
  teams,
  weeks,
  loading,
  onChanged,
}: ManualScheduleEditorProps) {
  const [newWeekName, setNewWeekName] = useState('');

  const nextWeekNumber =
    weeks.length > 0 ? Math.max(...weeks.map((w) => w.weekNumber)) + 1 : 1;

  const addWeekMutation = useMutation(
    (data: { name: string; weekNumber: number }) =>
      LeagueApi.createWeek(leagueId, { ...data, seasonId }),
    {
      onSuccess: () => {
        setNewWeekName('');
        onChanged();
      },
    },
  );

  const handleAddWeek = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeekName.trim()) return;
    addWeekMutation.mutate({ name: newWeekName.trim(), weekNumber: nextWeekNumber });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Manual Schedule Editor</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleAddWeek} className="flex items-end gap-2">
          <Input
            placeholder={`Week ${nextWeekNumber}`}
            value={newWeekName}
            onChange={(e) => setNewWeekName(e.target.value)}
            disabled={addWeekMutation.loading}
          />
          <Button type="submit" disabled={addWeekMutation.loading || !newWeekName.trim()}>
            {addWeekMutation.loading ? <Spinner size={16} /> : 'Add Week'}
          </Button>
        </form>
        {addWeekMutation.error && <ErrorAlert message={addWeekMutation.error} />}

        {loading && weeks.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <Spinner size={24} />
          </div>
        ) : weeks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No weeks yet — add one above.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {weeks.map((week) => (
              <WeekEditorCard
                key={week.id}
                leagueId={leagueId}
                week={week}
                teams={teams}
                onChanged={onChanged}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
