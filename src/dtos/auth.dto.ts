import { UserInputDto } from "./user.dto";

export type AuthStatus =
  | "idle"
  | "checking"
  | "authenticated"
  | "unauthenticated";

export interface AuthState {
  status: AuthStatus;
  user: UserInputDto | null;
  error: string | null;
  returnTo: string | null;
}

export interface AuthResponse {
  isAuthenticated: boolean;
  user?: UserInputDto;
}
