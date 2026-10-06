'use client';

import { useMemo } from 'react';

import { Card, CardHeader, CardTitle, TeamLogo } from '@/components';
import { computeTeamRecord, formatDifferential, formatWinPct } from '@/lib/teamStats';
import { formatUserDisplayName } from '@/lib/utils';
import type { TeamInput } from '@/types';

function RecordChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/[0.08] px-3 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>{' '}
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

export function TeamHeaderCard({ team }: { team: TeamInput }) {
  const record = useMemo(() => computeTeamRecord(team), [team]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <TeamLogo
            logoUrl={team.logoUrl}
            name={team.name}
            className="size-20 rounded-xl sm:size-24 md:size-28"
          />
          <div className="flex min-w-0 flex-col">
            <CardTitle>{team.name}</CardTitle>
            <div className="mt-1 text-sm font-normal text-muted-foreground">
              {formatUserDisplayName(team.user, 'Unclaimed')}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <RecordChip
                label="Match"
                value={`${record.matchWins}-${record.matchLosses} (${formatWinPct(record.matchWinPct)})`}
              />
              <RecordChip
                label="Game"
                value={`${record.gameWins}-${record.gameLosses} (${formatWinPct(record.gameWinPct)})`}
              />
              <RecordChip label="Diff" value={formatDifferential(record.differential)} />
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
