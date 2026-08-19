'use client';

import { create } from 'zustand';

const LS_RECENT_LEAGUE_KEY = 'draftmons:recentLeague';

type RecentLeague = {
  leagueId: number | null;
  leagueAbbreviation: string | null;
  seasonId: number | null;
  seasonName: string | null;
  /** `Date.now()` at write time; informational only. */
  updatedAt: number | null;
};

type RecentLeagueState = RecentLeague & {
  /** False until `hydrate` has run, so the first paint always matches the server. */
  hydrated: boolean;
};

type RecentLeagueActions = {
  hydrate: () => void;
  setRecent: (data: Omit<RecentLeague, 'updatedAt'>) => void;
  clear: () => void;
};

const EMPTY_RECENT: RecentLeague = {
  leagueId: null,
  leagueAbbreviation: null,
  seasonId: null,
  seasonName: null,
  updatedAt: null,
};

/**
 * Anything could be sitting under the key — a value from an older shape, or
 * hand-edited junk. Validate field by field and fall back to empty rather than
 * trusting the parse: a partially-valid entry would render a half-broken nav
 * section (a header with no name, or links built from a NaN id).
 */
function parseStored(raw: string): RecentLeague | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;

  const { leagueId, leagueAbbreviation, seasonId, seasonName, updatedAt } = parsed as Record<
    string,
    unknown
  >;

  const validId = (v: unknown): v is number =>
    typeof v === 'number' && Number.isInteger(v) && v > 0;

  if (!validId(leagueId) || !validId(seasonId)) return null;
  if (typeof leagueAbbreviation !== 'string' || typeof seasonName !== 'string') return null;

  return {
    leagueId,
    leagueAbbreviation,
    seasonId,
    seasonName,
    updatedAt: typeof updatedAt === 'number' && Number.isFinite(updatedAt) ? updatedAt : null,
  };
}

function persist(recent: RecentLeague): void {
  try {
    localStorage.setItem(LS_RECENT_LEAGUE_KEY, JSON.stringify(recent));
  } catch {
    // Private browsing / quota — the sidebar still works for this session.
  }
}

function clearStored(): void {
  try {
    localStorage.removeItem(LS_RECENT_LEAGUE_KEY);
  } catch {
    // Same as above — nothing to recover from.
  }
}

/**
 * The single most recently visited league/season, so its nav section stays
 * available in the sidebar after the user navigates to a general page.
 *
 * Only ever one entry — `setRecent` overwrites unconditionally, there is no MRU
 * list. Deliberately holds no role/moderator flag: this is client-writable
 * storage, so the sidebar's Admin section is gated on a live API response
 * instead (see `useSidebarSeasonContext` in `Sidebar.tsx`).
 *
 * Hydration is hand-rolled in `hydrate` (called from an effect) instead of
 * zustand's `persist` middleware, matching `useCustomSpeedStore` and keeping the
 * server-rendered markup free of client-only values.
 */
export const useRecentLeagueStore = create<RecentLeagueState & RecentLeagueActions>((set, get) => ({
  ...EMPTY_RECENT,
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const raw =
      typeof window === 'undefined' ? null : localStorage.getItem(LS_RECENT_LEAGUE_KEY);
    const stored = raw ? parseStored(raw) : null;
    set({ ...(stored ?? EMPTY_RECENT), hydrated: true });
  },

  setRecent: (data) => {
    const next: RecentLeague = { ...data, updatedAt: Date.now() };
    set(next);
    persist(next);
  },

  clear: () => {
    set({ ...EMPTY_RECENT });
    clearStored();
  },
}));
