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
  Pagination,
  SortControls,
} from '@/components';
import { CreateLeagueModal } from '@/components/modals/CreateLeagueModal';
import { useFetch } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { LeagueInput, PaginatedResponse } from '@/types';

const LEAGUE_SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'createdAt', label: 'Created At' },
];

export default function LeagueListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const url = useMemo(
    () => buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [], { page, pageSize, sortBy, sortOrder }),
    [page, pageSize, sortBy, sortOrder],
  );

  const { data, loading, error } = useFetch<PaginatedResponse<LeagueInput>>(url);

  const handleLeagueCreated = (league?: LeagueInput) => {
    if (league?.id) {
      router.push(`/league/${league.id}`);
    }
  };

  const handleSortChange = (newSortBy: string, newSortOrder: 'ASC' | 'DESC') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
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

      <SortControls
        options={LEAGUE_SORT_OPTIONS}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        disabled={loading}
        className="mb-4"
      />

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

          <Pagination
            page={data.page}
            pageSize={pageSize}
            totalPages={data.totalPages}
            total={data.total}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
            disabled={loading}
            className="mt-4"
          />
        </>
      )}
    </div>
  );
}
