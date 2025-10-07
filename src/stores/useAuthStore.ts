'use client';

import { create } from 'zustand';
import { ENDPOINTS } from '@/lib/constants';
import { AuthResponse, UserInputDto } from '@/types';
import { Api, ApiError } from '@/lib/api';

type AuthState = {
  user: UserInputDto | null;
  isAuthenticated: boolean;
  loading: boolean;
  error?: string | null;
};

type AuthActions = {
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserInputDto | null) => void;
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  checkAuth: async () => {
    set({ loading: true, error: null });
    try {
      const data = await Api.get<AuthResponse>(ENDPOINTS.AUTH_STATUS);
      set({
        user: data.user || null,
        isAuthenticated: !!data.isAuthenticated,
        loading: false
      });
    } catch (e) {
      const error = e as ApiError;
      set({ loading: false, isAuthenticated: false, user: null, error: error?.message || 'Auth error' });
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await Api.post(ENDPOINTS.AUTH_LOGOUT);
      set({ user: null, isAuthenticated: false, loading: false });
    } catch (e) {
      const error = e as ApiError;
      set({ loading: false, error: error?.message || 'Logout failed' });
      throw error;
    }
  }
}));
