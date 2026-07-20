'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, ErrorAlert, Input, Spinner } from '@/components';
import { useMutation } from '@/hooks';
import { LeagueApi } from '@/lib/api';
import type { TeamInput } from '@/types';

interface TeamSkillLevelRowProps {
  leagueId: number;
  team: TeamInput;
  onChanged: () => void;
}

function TeamSkillLevelRow({ leagueId, team, onChanged }: TeamSkillLevelRowProps) {
  const initialValue = team.skillLevel != null ? String(team.skillLevel) : '';
  const [value, setValue] = useState(initialValue);

  const mutation = useMutation(
    (skillLevel: number) => LeagueApi.updateTeam(leagueId, team.id, { skillLevel }),
    { onSuccess: onChanged },
  );

  const parsed = Number(value);
  const isValid = value !== '' && !Number.isNaN(parsed) && parsed >= 1 && parsed <= 100;
  const dirty = value !== initialValue;

  return (
    <div className="flex flex-col gap-1 border-b border-border py-2 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm">{team.name}</span>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={100}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-20"
            disabled={mutation.loading}
          />
          <Button
            size="sm"
            onClick={() => mutation.mutate(parsed)}
            disabled={mutation.loading || !dirty || !isValid}
          >
            {mutation.loading ? <Spinner size={14} /> : 'Save'}
          </Button>
        </div>
      </div>
      {mutation.error && <ErrorAlert message={mutation.error} />}
    </div>
  );
}

interface TeamSkillLevelsProps {
  leagueId: number;
  teams: TeamInput[];
  onChanged: () => void;
}

export function TeamSkillLevels({ leagueId, teams, onChanged }: TeamSkillLevelsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Team Skill Levels</CardTitle>
      </CardHeader>
      <CardContent>
        {teams.length === 0 ? (
          <p className="text-sm text-muted-foreground">No teams in this season yet.</p>
        ) : (
          <div className="flex flex-col">
            {teams.map((team) => (
              <TeamSkillLevelRow key={team.id} leagueId={leagueId} team={team} onChanged={onChanged} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
