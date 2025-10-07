// Validate required environment variables
const getApiBaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  if (typeof window !== 'undefined' && url.includes('localhost') && process.env.NODE_ENV === 'production') {
    console.warn('Warning: Using localhost API URL in production');
  }

  return url;
};

const getClientUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3333';

  if (typeof window !== 'undefined' && url.includes('localhost') && process.env.NODE_ENV === 'production') {
    console.warn('Warning: Using localhost client URL in production');
  }

  return url;
};

export const API_BASE_URL = getApiBaseUrl();
export const CLIENT_URL = getClientUrl();

export const ENDPOINTS = {
  AUTH_STATUS: `${API_BASE_URL}/api/auth/status`,
  AUTH_GOOGLE: `${API_BASE_URL}/api/auth/google`,
  AUTH_LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  LEAGUE_BASE: `${API_BASE_URL}/api/league`
} as const;
