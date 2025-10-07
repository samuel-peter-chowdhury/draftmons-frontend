import { UserInputDto } from './user.type';

export interface AuthResponse {
  isAuthenticated: boolean;
  user?: UserInputDto;
}
