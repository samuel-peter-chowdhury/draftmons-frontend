import { Api } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { AuthResponse } from '@/types';

/**
 * Auth API - handles all /api/auth endpoints
 */
export const AuthApi = {
  /**
   * GET /api/auth/status
   * Check authentication status
   */
  checkStatus: () => {
    return Api.get<AuthResponse>(BASE_ENDPOINTS.AUTH_STATUS);
  },

  /**
   * POST /api/auth/logout
   * Logout the current user
   */
  logout: () => {
    return Api.post<void>(BASE_ENDPOINTS.AUTH_LOGOUT);
  },

  /**
   * Build Google OAuth URL
   * @param redirectUrl - The URL to redirect to after authentication
   */
  getGoogleAuthUrl: (redirectUrl: string) => {
    return `${BASE_ENDPOINTS.AUTH_GOOGLE}?redirect=${encodeURIComponent(redirectUrl)}`;
  },
};
