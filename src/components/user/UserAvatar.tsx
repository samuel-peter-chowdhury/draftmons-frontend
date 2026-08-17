'use client';

import Image from 'next/image';
import { User } from 'lucide-react';

interface UserAvatarProps {
  avatarUrl: string | null | undefined;
  name?: string;
  /** Sizing/spacing overrides. Applies to both the image and the icon fallback. */
  className?: string;
}

/**
 * Inline user avatar. Falls back to the lucide `User` icon (matching the
 * existing Header profile button) rather than an empty box.
 */
export function UserAvatar({
  avatarUrl,
  name = 'User',
  className = 'h-6 w-6 rounded-full object-cover',
}: UserAvatarProps) {
  if (!avatarUrl) {
    return <User className={className} aria-hidden />;
  }
  return (
    <Image
      src={avatarUrl}
      alt={`${name} avatar`}
      width={48}
      height={48}
      unoptimized
      className={className}
    />
  );
}
