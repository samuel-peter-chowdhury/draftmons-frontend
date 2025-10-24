'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorAlert,
  Spinner,
  Label,
  Select,
} from '@/components';
import { CreateLeagueModal } from '@/components/modals/CreateLeagueModal';
import { useFetch } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { LeagueInputDto, PaginatedResponse } from '@/types';

export default function LeagueListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<'name' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const url = useMemo(
    () => buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [], { page, pageSize, sortBy, sortOrder }),
    [page, pageSize, sortBy, sortOrder],
  );

  const { data, loading, error } = useFetch<PaginatedResponse<LeagueInputDto>>(url);

  const handleLeagueCreated = (league?: LeagueInputDto) => {
    if (league?.id) {
      router.push(`/league/${league.id}`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leagues</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>Create League</Button>
      </div>

      <CreateLeagueModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleLeagueCreated}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Label htmlFor="sort-by" className="text-sm">
          Sort by:
        </Label>
        <Select
          id="sort-by"
          className="h-auto w-auto p-2 text-sm"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'createdAt')}
          aria-label="Sort leagues by field"
        >
          <option value="name">Name</option>
          <option value="createdAt">Created At</option>
        </Select>
        <Label htmlFor="sort-order" className="sr-only">
          Sort order
        </Label>
        <Select
          id="sort-order"
          className="h-auto w-auto p-2 text-sm"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'ASC' | 'DESC')}
          aria-label="Sort order ascending or descending"
        >
          <option value="ASC">ASC</option>
          <option value="DESC">DESC</option>
        </Select>
        <Label htmlFor="page-size" className="ml-4 text-sm">
          Page size:
        </Label>
        <Select
          id="page-size"
          className="h-auto w-auto p-2 text-sm"
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          aria-label="Number of items per page"
        >
          <option>5</option>
          <option>10</option>
          <option>20</option>
        </Select>
      </div>

      {error && <ErrorAlert message={error} />}

      {loading && !data && (
        <div className="flex items-center justify-center py-10">
          <Spinner size={32} />
        </div>
      )}

      {data && (
        <>
          <div className={loading ? 'pointer-events-none opacity-50' : ''}>
            <div className="grid gap-3 md:grid-cols-2">
              {data.data.map((league) => (
                <Card key={league.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{league.name}</span>
                      <span className="text-sm text-muted-foreground">{league.abbreviation}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-end">
                    <Link href={`/league/${league.id}`}>
                      <Button variant="secondary">Open</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Go to previous page"
            >
              Previous
            </Button>
            <div className="text-sm text-muted-foreground" role="status" aria-live="polite">
              Page {data.page} of {data.totalPages} • {data.total} total
            </div>
            <Button
              variant="outline"
              onClick={() => setPage((p) => (data && p < data.totalPages ? p + 1 : p))}
              disabled={data && page >= data.totalPages}
              aria-label="Go to next page"
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
