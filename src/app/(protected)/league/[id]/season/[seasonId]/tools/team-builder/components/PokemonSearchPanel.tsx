'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Spinner, Button, ErrorAlert, Pagination } from '@/components';
import { useFetch } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { cn } from '@/lib/utils';

// Minimal UI model. Expand if your API returns more fields.
export type PokemonSearchItem = {
  id: number;
  name: string;
  spriteUrl?: string;
  pokemonTypes?: { id: number; name: string; color?: string }[];
};

type Paginated<T> = {
  data: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
};

type SearchPokemonPanelProps = {
  title?: string;
  onSelect: (pokemon: PokemonSearchItem) => void;
  disabled?: boolean;
  className?: string;
};

export default function SearchPokemonPanel({
  title = 'Search Pokémon',
  onSelect,
  disabled = false,
  className,
}: SearchPokemonPanelProps) {
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(24);

  // Build URL to your existing backend endpoint.
  // NOTE: I don't know your exact query param name. Common ones: "q", "search", "name".
  // Swap "search" to whatever your API expects.
  const url = React.useMemo(() => {
    const trimmed = query.trim();
    return buildUrlWithQuery(
      BASE_ENDPOINTS.POKEMON_BASE,
      [],
      {
        page,
        pageSize,
        full: true,
        search: trimmed.length ? trimmed : undefined,
      } as any,
    );
  }, [query, page, pageSize]);

  const { data, loading, error } = useFetch<Paginated<PokemonSearchItem>>(url);

  const results = data && data.data ? data.data : [];

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setPage(1);
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <span className="text-xs text-muted-foreground">Add to pool / slot</span>
        </CardTitle>

        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={handleChange}
            placeholder="Search Pokémon..."
            disabled={disabled}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <Button
            type="button"
            variant="secondary"
            disabled={disabled}
            onClick={() => setQuery('')}
          >
            Clear
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error ? <ErrorAlert message={error} /> : null}

        {loading && !data ? (
          <div className="flex items-center justify-center py-10">
            <Spinner size={28} />
          </div>
        ) : null}

        {!loading && results.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No Pokémon found.
          </div>
        ) : null}

        {results.length ? (
          <div className={cn('flex flex-wrap gap-2', disabled ? 'pointer-events-none opacity-50' : '')}>
            {results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelect(p)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm',
                  'border-border bg-background hover:bg-accent hover:text-accent-foreground',
                  'transition-colors',
                )}
              >
                {p.spriteUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.spriteUrl} alt={p.name} className="h-5 w-5" />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-muted" />
                )}
                <span className="font-medium">{p.name}</span>

                {p.pokemonTypes && p.pokemonTypes.length ? (
                  <span className="ml-1 text-xs text-muted-foreground">
                    {p.pokemonTypes.map((t) => t.name).join('/')}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}

        {data ? (
          <Pagination
            page={data.page}
            pageSize={pageSize}
            totalPages={data.totalPages}
            total={data.total}
            onPageChange={setPage}
            onPageSizeChange={(size: number) => {
              setPageSize(size);
              setPage(1);
            }}
            disabled={disabled || loading}
            className="mt-4"
          />
        ) : null}
      </CardContent>
    </Card>
  );
}