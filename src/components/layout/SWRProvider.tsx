'use client';

import { SWRConfig } from 'swr';
import { apiFetch } from '@/lib/api';

/**
 * Global SWR configuration for all protected routes.
 *
 * - `fetcher` routes every keyed request through `apiFetch`, preserving
 *   `credentials: 'include'`, CSRF handling, and the 401 → login redirect.
 * - `dedupingInterval` collapses rapid re-mounts of the same key (the
 *   "pages reloaded many times back to back" symptom, e.g. the Board↔Rapid
 *   toggle remounting `RapidPlacementView` and re-shipping the whole gen dex)
 *   into a single request.
 * - `revalidateOnFocus: false` stops a full refetch every time an admin flips
 *   browser tabs. Actively-edited views (tier list) rely on explicit
 *   optimistic `setData`/`refetch` rather than focus revalidation, so this is
 *   safe here; override per-hook if a future view needs focus revalidation.
 */
export default function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => apiFetch(url),
        dedupingInterval: 5000,
        revalidateOnFocus: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
