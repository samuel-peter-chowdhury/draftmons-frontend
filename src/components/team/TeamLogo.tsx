'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

const PLACEHOLDER_LOGO_SRC = '/images/pokeball-placeholder.webp';

interface TeamLogoProps {
  logoUrl: string | null | undefined;
  name: string;
  /** Sizing/spacing overrides — render contexts vary from table cell to hero card heading. */
  className?: string;
}

/**
 * Team logo. Unlike LeagueLogo, this always renders a box — teams are common
 * enough that a missing logo falls back to a pokeball placeholder instead of
 * disappearing, so team rows/cards stay visually uniform.
 *
 * A real logo fills the box with `object-cover` (cropping any overflow) inside an
 * `overflow-hidden rounded-md` wrapper, so the rounded corners always render
 * cleanly. The placeholder uses `object-contain` on a muted backdrop instead,
 * since cropping the pokeball icon would cut off its silhouette.
 */
export function TeamLogo({ logoUrl, name, className = 'h-6 w-6' }: TeamLogoProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 overflow-hidden rounded-md',
        !logoUrl && 'bg-muted p-1',
        className,
      )}
    >
      <Image
        src={logoUrl || PLACEHOLDER_LOGO_SRC}
        alt={logoUrl ? `${name} logo` : `${name} (no logo set)`}
        width={128}
        height={128}
        unoptimized
        className={cn('h-full w-full', logoUrl ? 'object-cover' : 'object-contain')}
      />
    </span>
  );
}
