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
  /** Tracks the league ID currently being fetched to prevent race conditions */
  _fetchingLeagueId: number | null;
  /** Tracks the season ID currently being fetched to prevent race conditions */
  _fetchingSeasonId: number | null;
};

type LeagueActions = {
  fetchLeague: (leagueId: number) => Promise<void>;
  fetchSeason: (leagueId: number, seasonId: number) => Promise<void>;
  /** Force-refetch the current league, bypassing the cache check */
  refetchLeague: (leagueId: number) => Promise<void>;
  /** Force-refetch the current season, bypassing the cache check */
  refetchSeason: (leagueId: number, seasonId: number) => Promise<void>;
  clear: () => void;
};

const initialState: LeagueState = {
  league: null,
  season: null,
  leagueLoading: false,
  seasonLoading: false,
  leagueError: null,
  seasonError: null,
  _fetchingLeagueId: null,
  _fetchingSeasonId: null,
};

async function fetchLeagueImpl(
  leagueId: number,
  set: (partial: Partial<LeagueState>) => void,
) {
  set({ leagueLoading: true, leagueError: null, _fetchingLeagueId: leagueId });
  try {
    const url = buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId], { full: true });
    const league = await apiFetch<LeagueInput>(url);
    set({ league, leagueLoading: false, _fetchingLeagueId: null });
  } catch (e: any) {
    set({
      leagueLoading: false,
      _fetchingLeagueId: null,
      leagueError: e?.body?.message || e?.message || 'Failed to load league',
    });
  }
}

async function fetchSeasonImpl(
  leagueId: number,
  seasonId: number,
  set: (partial: Partial<LeagueState>) => void,
) {
  set({ seasonLoading: true, seasonError: null, _fetchingSeasonId: seasonId });
  try {
    const url = buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'season', seasonId], {
      full: true,
    });
    const season = await apiFetch<SeasonInput>(url);
    set({ season, seasonLoading: false, _fetchingSeasonId: null });
  } catch (e: any) {
    set({
      seasonLoading: false,
      _fetchingSeasonId: null,
      seasonError: e?.body?.message || e?.message || 'Failed to load season',
    });
  }
}

export const useLeagueStore = create<LeagueState & LeagueActions>((set, get) => ({
  ...initialState,

  fetchLeague: async (leagueId: number) => {
    const state = get();
    // Skip if already loaded or currently fetching this league
    if (
      (state.league?.id === leagueId && !state.leagueError) ||
      state._fetchingLeagueId === leagueId
    ) {
      return;
    }
    await fetchLeagueImpl(leagueId, set);
  },

  fetchSeason: async (leagueId: number, seasonId: number) => {
    const state = get();
    // Skip if already loaded or currently fetching this season
    if (
      (state.season?.id === seasonId && !state.seasonError) ||
      state._fetchingSeasonId === seasonId
    ) {
      return;
    }
    await fetchSeasonImpl(leagueId, seasonId, set);
  },

  refetchLeague: async (leagueId: number) => {
    await fetchLeagueImpl(leagueId, set);
  },

  refetchSeason: async (leagueId: number, seasonId: number) => {
    await fetchSeasonImpl(leagueId, seasonId, set);
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
