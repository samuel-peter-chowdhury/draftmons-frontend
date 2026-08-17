'use client';

import type { PreviewErrorDto } from '@/types';

interface UnresolvedBannerProps {
  errors: PreviewErrorDto[];
}

export function UnresolvedBanner({ errors }: UnresolvedBannerProps) {
  if (errors.length === 0) return null;

  return (
    <div className="sticky top-0 z-10 mb-4 rounded-md border border-border bg-secondary p-4">
      <span className="text-sm font-semibold">
        {errors.length} item(s) need attention before submitting
      </span>
      <ul className="mt-2">
        {errors.map((err, i) => (
          <li key={i} className="text-sm text-muted-foreground">
            {err.field} — {err.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
