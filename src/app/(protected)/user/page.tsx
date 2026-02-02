'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
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
import { useFetch } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { UserInput, PaginatedResponse } from '@/types';

const USER_SORT_OPTIONS = [
  { value: 'lastName', label: 'Last Name' },
  { value: 'createdAt', label: 'Created At' },
];

export default function UserListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('lastName');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  const url = useMemo(
    () => buildUrlWithQuery(BASE_ENDPOINTS.USER_BASE, [], { page, pageSize, sortBy, sortOrder }),
    [page, pageSize, sortBy, sortOrder],
  );

  const { data, loading, error } = useFetch<PaginatedResponse<UserInput>>(url);

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
        <h1 className="text-2xl font-semibold">Users</h1>
      </div>

      <SortControls
        options={USER_SORT_OPTIONS}
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
              {data.data.map((user) => {
                const displayName =
                  user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`.trim()
                    : user.firstName || user.lastName || user.email || 'Unknown User';

                return (
                  <Card key={user.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{displayName}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {user.email && (
                        <div className="text-muted-foreground">{user.email}</div>
                      )}
                      <div className="flex items-center justify-end">
                        <Link href={`/user/${user.id}` as any}>
                          <Button variant="secondary">View Profile</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
