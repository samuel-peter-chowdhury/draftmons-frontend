'use client';

import { create } from 'zustand';

type UiState = {
  sidebarOpen: boolean;
  expandedGroups: Record<string, boolean>;
  activeLeagueId: string | null;
};

type UiActions = {
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  toggleGroup: (key: string) => void;
  setActiveLeagueId: (id: string | null) => void;
};

export const useUiStore = create<UiState & UiActions>((set) => ({
  sidebarOpen: false,
  expandedGroups: {},
  activeLeagueId: null,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar: (open) => set({ sidebarOpen: open }),
  toggleGroup: (key) =>
    set((s) => ({ expandedGroups: { ...s.expandedGroups, [key]: !s.expandedGroups[key] } })),
  setActiveLeagueId: (id) => set({ activeLeagueId: id })
}));
