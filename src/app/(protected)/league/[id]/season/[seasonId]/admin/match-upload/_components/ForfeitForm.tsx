'use client';

import { Input, Select } from '@/components';
import { cn } from '@/lib/utils';
import type { ManualTeamOption } from './manual-entry.types';

interface ForfeitFormProps {
  teams: ManualTeamOption[];
  winningTeamId: number | null;
  score: string;
  numberOfGames: number;
  onChangeWinner: (teamId: number | null) => void;
  onChangeScore: (score: string) => void;
}

/**
 * A forfeit is a clean sweep: pick the team that advances, and optionally how many
 * games to credit them with. The score expands into that many placeholder Game
 * rows (differential 0, no stats) so standings and game counts stay consistent;
 * leaving it blank records the match result with no games at all.
 */
export function ForfeitForm({
  teams,
  winningTeamId,
  score,
  numberOfGames,
  onChangeWinner,
  onChangeScore,
}: ForfeitFormProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Winning team</label>
        <Select
          value={winningTeamId !== null ? String(winningTeamId) : ''}
          className={cn('w-56', winningTeamId === null && 'ring-1 ring-destructive')}
          onChange={(e) => onChangeWinner(e.target.value === '' ? null : Number(e.target.value))}
        >
          <option value="" disabled>
            Select winner
          </option>
          {teams.map((t) => (
            <option key={t.teamId} value={String(t.teamId)}>
              {t.teamName}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Games credited (optional)</label>
        <Input
          type="number"
          min="0"
          max={numberOfGames}
          placeholder="—"
          className="w-32"
          value={score}
          onChange={(e) => onChangeScore(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Blank records no games. Max {numberOfGames}.
        </p>
      </div>
    </div>
  );
}
