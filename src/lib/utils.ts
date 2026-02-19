import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a generation name for display in the UI.
 * - Names with 2 characters or less are converted to uppercase (e.g., "sv" → "SV")
 * - Longer names have underscores replaced with spaces and each word capitalized (e.g., "scarlet_violet" → "Scarlet Violet")
 *
 * @param name - The raw generation name to format
 * @returns The formatted generation name
 *
 * @example
 * formatGenerationName("sv") // Returns "SV"
 * formatGenerationName("scarlet_violet") // Returns "Scarlet Violet"
 * formatGenerationName("gen_9") // Returns "Gen 9"
 */
export function formatUserDisplayName(
  user: { firstName?: string | null; lastName?: string | null; email?: string } | null | undefined,
  fallback = 'Unknown User',
): string {
  if (!user) return fallback;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`.trim();
  return user.firstName || user.lastName || user.email || fallback;
}

export function formatGenerationName(name: string): string {
  if (name.length <= 2) {
    return name.toUpperCase();
  }
  return name
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
