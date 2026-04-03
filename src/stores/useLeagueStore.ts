'use client';

import { create } from 'zustand';
import { apiFetch } from '@/lib/api';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { LeagueInput, SeasonInput } from '@/types';

type LeagueState = {
  league: LeagueInput | null;
  season: SeasonInput | null;
  leagueLoading: boolean;
  seasonLoading: boolean;
  leagueError: string | null;
  seasonError: string | null;
};

type LeagueActions = {
  fetchLeague: (leagueId: number) => Promise<void>;
  fetchSeason: (leagueId: number, seasonId: number) => Promise<void>;
  clear: () => void;
};

const initialState: LeagueState = {
  league: null,
  season: null,
  leagueLoading: false,
  seasonLoading: false,
  leagueError: null,
  seasonError: null,
};

export const useLeagueStore = create<LeagueState & LeagueActions>((set, get) => ({
  ...initialState,

  fetchLeague: async (leagueId: number) => {
    // Skip if already loaded for this league
    if (get().league?.id === leagueId && !get().leagueError) return;

    set({ leagueLoading: true, leagueError: null });
    try {
      const url = buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId], { full: true });
      const league = await apiFetch<LeagueInput>(url);
      set({ league, leagueLoading: false });
    } catch (e: any) {
      set({
        leagueLoading: false,
        leagueError: e?.body?.message || e?.message || 'Failed to load league',
      });
    }
  },

  fetchSeason: async (leagueId: number, seasonId: number) => {
    // Skip if already loaded for this season
    if (get().season?.id === seasonId && !get().seasonError) return;

    set({ seasonLoading: true, seasonError: null });
    try {
      const url = buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'season', seasonId], {
        full: true,
      });
      const season = await apiFetch<SeasonInput>(url);
      set({ season, seasonLoading: false });
    } catch (e: any) {
      set({
        seasonLoading: false,
        seasonError: e?.body?.message || e?.message || 'Failed to load season',
      });
    }
  },

  clear: () => set(initialState),
}));

/**
 * Derived helper: check if the given userId is a moderator of the current league.
 * Usage: const isModerator = useIsModerator(currentUser?.id);
 */
export function useIsModerator(userId: number | undefined): boolean {
  return useLeagueStore((s) =>
    userId
      ? s.league?.leagueUsers?.some((lu) => lu.userId === userId && lu.isModerator) ?? false
      : false,
  );
}
