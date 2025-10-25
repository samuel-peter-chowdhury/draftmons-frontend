import { UserInput } from './user.type';

export interface AuthResponse {
  isAuthenticated: boolean;
  user?: UserInput;
}
