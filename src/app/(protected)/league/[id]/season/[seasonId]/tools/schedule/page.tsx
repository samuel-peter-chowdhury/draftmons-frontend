'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, ErrorAlert, Spinner } from '@/components';
import { useApiSWR } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { MatchInput, PaginatedResponse, WeekInput } from '@/types';

import { MatchRow } from './_components';

function isRenderableMatch(match: MatchInput): boolean {
  return (match.teams ?? []).length === 2;
}

export default function SeasonSchedulePage() {
  const params = useParams<{ id: string; seasonId: string }>();
  const leagueId = Number(params.id);
  const seasonId = Number(params.seasonId);

  const weeksUrl = buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'week'], {
    seasonId,
    full: true,
    pageSize: 100,
    sortBy: 'weekNumber',
    sortOrder: 'ASC',
  });
  const { data, loading, error } = useApiSWR<PaginatedResponse<WeekInput>>(weeksUrl);

  const weeks = useMemo(
    () => [...(data?.data ?? [])].sort((a, b) => a.weekNumber - b.weekNumber),
    [data],
  );

  return (
    <div className="mx-auto max-w-7xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Schedule</h1>

      {error && <ErrorAlert message={error} />}

      {loading && !data && (
        <div className="flex items-center justify-center py-10">
          <Spinner size={32} />
        </div>
      )}

      {data && (
        <Accordion type="multiple" defaultValue={weeks.map((week) => String(week.id))}>
          {weeks.map((week) => {
            const renderableMatches = (week.matches ?? []).filter(isRenderableMatch);

            return (
              <AccordionItem key={week.id} value={String(week.id)}>
                <AccordionTrigger className="px-1">{week.name}</AccordionTrigger>
                <AccordionContent className="px-1">
                  {renderableMatches.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No matchups scheduled yet</p>
                  ) : (
                    <div className="space-y-2">
                      {renderableMatches.map((match) => (
                        <MatchRow
                          key={match.id}
                          match={match}
                          leagueId={leagueId}
                          seasonId={seasonId}
                        />
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
