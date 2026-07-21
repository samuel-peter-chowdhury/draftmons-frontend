'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface TeamLogoProps {
  logoUrl: string | null | undefined;
  name: string;
  /** Sizing/spacing overrides — render contexts vary from table cell to card heading. */
  className?: string;
}

/**
 * Inline team logo. Renders nothing when unset so the surrounding flex gap
 * collapses and the team name sits flush (no phantom left-shift).
 *
 * The image fills the box with `object-cover` (cropping any overflow) inside an
 * `overflow-hidden rounded-md` wrapper, so the rounded corners always render
 * cleanly — `object-contain` would leave blank space on one axis, exposing the
 * image's own square corners inside the rounded box.
 */
export function TeamLogo({ logoUrl, name, className = 'h-6 w-6' }: TeamLogoProps) {
  if (!logoUrl) {
    return null;
  }
  return (
    <span className={cn('inline-flex shrink-0 overflow-hidden rounded-md', className)}>
      <Image
        src={logoUrl}
        alt={`${name} logo`}
        width={48}
        height={48}
        unoptimized
        className="h-full w-full object-cover"
      />
    </span>
  );
}
