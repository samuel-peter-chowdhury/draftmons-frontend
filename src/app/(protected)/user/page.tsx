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
  Label,
  Select,
} from '@/components';
import { useFetch } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { UserInput, PaginatedResponse } from '@/types';

export default function UserListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<'lastName' | 'createdAt'>('lastName');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  const url = useMemo(
    () => buildUrlWithQuery(BASE_ENDPOINTS.USER_BASE, [], { page, pageSize, sortBy, sortOrder }),
    [page, pageSize, sortBy, sortOrder],
  );

  const { data, loading, error } = useFetch<PaginatedResponse<UserInput>>(url);

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Label htmlFor="sort-by" className="text-sm">
          Sort by:
        </Label>
        <Select
          id="sort-by"
          className="h-auto w-auto p-2 text-sm"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'lastName' | 'createdAt')}
          aria-label="Sort users by field"
        >
          <option value="lastName">Last Name</option>
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
