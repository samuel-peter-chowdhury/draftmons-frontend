'use client';

import { create } from 'zustand';
import { AuthApi, ApiError } from '@/lib/api';
import type { AuthResponse, UserInput } from '@/types';

type AuthState = {
  user: UserInput | null;
  isAuthenticated: boolean;
  loading: boolean;
  error?: string | null;
};

type AuthActions = {
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserInput | null) => void;
};

let _checkingAuth = false;

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  checkAuth: async () => {
    if (_checkingAuth) return;
    _checkingAuth = true;
    set({ loading: true, error: null });
    try {
      const data = await AuthApi.checkStatus();
      set({
        user: data.user || null,
        isAuthenticated: !!data.isAuthenticated,
        loading: false,
      });
    } catch (e) {
      const error = e as ApiError;
      set({
        loading: false,
        isAuthenticated: false,
        user: null,
        error: error?.message || 'Auth error',
      });
    } finally {
      _checkingAuth = false;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await AuthApi.logout();
      set({ user: null, isAuthenticated: false, loading: false });
    } catch (e) {
      const error = e as ApiError;
      set({ loading: false, error: error?.message || 'Logout failed' });
      throw error;
    }
  },
}));
