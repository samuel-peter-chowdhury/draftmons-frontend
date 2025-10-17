'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, ErrorAlert, Spinner } from '@/components';
import { useFetch } from '@/hooks';
import { ENDPOINTS } from '@/lib/constants';
import type { LeagueInputDto } from '@/types';

export default function LeagueDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, error } = useFetch<LeagueInputDto>(`${ENDPOINTS.LEAGUE_BASE}/${params.id}?full=true`);

  return (
    <div className="mx-auto max-w-7xl p-4">
      {error && <ErrorAlert message={error} />}

      {loading && !data && (
        <div className="flex items-center justify-center py-10">
          <Spinner size={32} />
        </div>
      )}

      {data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{data.name}</span>
              <span className="text-sm text-muted-foreground">{data.abbreviation}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div>ID: {data.id}</div>
            <div>Created: {new Date(data.createdAt).toLocaleString()}</div>
            <div>Updated: {new Date(data.updatedAt).toLocaleString()}</div>
            <div className="pt-2 text-foreground">More sections coming soon…</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
