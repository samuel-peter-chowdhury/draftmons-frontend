'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, ErrorAlert, Input, Spinner } from '@/components';
import { LeagueApi } from '@/lib/api';
import { generateSchedule, getFeasibilityError, type GeneratedSchedule } from '@/lib/scheduling';
import type { TeamInput, WeekInput } from '@/types';

interface AutoGenerateSectionProps {
  leagueId: number;
  seasonId: number;
  numberOfWeeks: number;
  teams: TeamInput[];
  weeks: WeekInput[];
  weeksLoading: boolean;
  onScheduleSaved: () => void;
}

export function AutoGenerateSection({
  leagueId,
  seasonId,
  numberOfWeeks,
  teams,
  weeks,
  weeksLoading,
  onScheduleSaved,
}: AutoGenerateSectionProps) {
  const [preview, setPreview] = useState<GeneratedSchedule | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const teamsById = new Map(teams.map((t) => [t.id, t]));
  const missingSkillTeams = teams.filter((t) => t.skillLevel == null);
  const feasibilityError = getFeasibilityError(teams.length, numberOfWeeks);
  const hasExistingWeeks = weeks.length > 0;

  const canGenerate = missingSkillTeams.length === 0 && !feasibilityError && !hasExistingWeeks;

  const handleGenerate = () => {
    if (!canGenerate) return;
    const schedulingTeams = teams.map((t) => ({ teamId: t.id, skillLevel: t.skillLevel! }));
    setPreview(generateSchedule(schedulingTeams, numberOfWeeks));
    setSaveError(null);
  };

  const handleRenameWeek = (index: number, name: string) => {
    setPreview((prev) => {
      if (!prev) return prev;
      const nextWeeks = [...prev.weeks];
      nextWeeks[index] = { ...nextWeeks[index], name };
      return { ...prev, weeks: nextWeeks };
    });
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    setSaveError(null);
    try {
      for (let i = 0; i < preview.weeks.length; i++) {
        const week = preview.weeks[i];
        const createdWeek = await LeagueApi.createWeek(leagueId, {
          name: week.name,
          weekNumber: i + 1,
          seasonId,
        });
        for (const pairing of week.pairings) {
          await LeagueApi.createMatch(leagueId, {
            weekId: createdWeek.id,
            teamIds: [pairing.teamAId, pairing.teamBId],
          });
        }
      }
      setPreview(null);
      onScheduleSaved();
    } catch (e) {
      const err = e as { body?: { message?: string }; message?: string };
      setSaveError(
        err.body?.message || err.message || 'Failed to save schedule. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Auto-Generate Round Robin</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {weeksLoading && (
          <div className="flex items-center justify-center py-4">
            <Spinner size={20} />
          </div>
        )}

        {!weeksLoading && hasExistingWeeks && (
          <p className="text-sm text-muted-foreground">
            Delete all existing weeks to generate a new schedule.
          </p>
        )}

        {!weeksLoading && !hasExistingWeeks && missingSkillTeams.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Every team needs a skill level set before a schedule can be generated (missing:{' '}
            {missingSkillTeams.map((t) => t.name).join(', ')}).
          </p>
        )}

        {!weeksLoading &&
          !hasExistingWeeks &&
          missingSkillTeams.length === 0 &&
          feasibilityError && <ErrorAlert title="Cannot generate schedule" message={feasibilityError} />}

        {!weeksLoading && canGenerate && (
          <div className="flex gap-2">
            <Button onClick={handleGenerate}>{preview ? 'Regenerate' : 'Generate'}</Button>
            {preview && (
              <Button variant="secondary" onClick={() => setPreview(null)} disabled={saving}>
                Clear Preview
              </Button>
            )}
          </div>
        )}

        {preview && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              {preview.weeks.map((week, index) => (
                <div key={index} className="rounded-md border border-border p-3">
                  <Input
                    value={week.name}
                    onChange={(e) => handleRenameWeek(index, e.target.value)}
                    className="mb-2 w-48"
                    disabled={saving}
                  />
                  <ul className="space-y-1 text-sm">
                    {week.pairings.map((pairing, pIndex) => (
                      <li key={pIndex}>
                        {teamsById.get(pairing.teamAId)?.name ?? pairing.teamAId} vs{' '}
                        {teamsById.get(pairing.teamBId)?.name ?? pairing.teamBId}
                      </li>
                    ))}
                    {week.byeTeamId != null && (
                      <li className="text-muted-foreground">
                        Bye: {teamsById.get(week.byeTeamId)?.name ?? week.byeTeamId}
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium">Schedule Balance</h4>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-1 pr-2">Team</th>
                    <th className="py-1 pr-2">Skill</th>
                    <th className="py-1 pr-2">Opponents</th>
                    <th className="py-1 pr-2">Avg Opponent Skill</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.balance.map((row) => (
                    <tr key={row.teamId} className="border-b border-border last:border-0">
                      <td className="py-1 pr-2">{teamsById.get(row.teamId)?.name ?? row.teamId}</td>
                      <td className="py-1 pr-2">{row.skillLevel}</td>
                      <td className="py-1 pr-2">{row.opponentsCount}</td>
                      <td className="py-1 pr-2">
                        {row.averageOpponentSkill != null ? row.averageOpponentSkill.toFixed(1) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {saveError && <ErrorAlert message={saveError} />}

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Spinner size={16} /> : 'Save Schedule'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
