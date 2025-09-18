export interface User {
  id: string;
  name: string;
  email: string;
  photo?: string;
}

export type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  error: string | null;
  returnTo: string | null;
}

export interface AuthResponse {
  authenticated: boolean;
  user?: User;
}