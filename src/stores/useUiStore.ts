'use client';

import { create } from 'zustand';

type UiState = {
  sidebarOpen: boolean;
};

type UiActions = {
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
};

export const useUiStore = create<UiState & UiActions>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar: (open) => set({ sidebarOpen: open }),
}));
