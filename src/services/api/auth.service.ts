import httpService from '../http.service';
import { AuthResponse } from '@/dtos/auth.dto';
import { API_URL } from '@/utils/constants';

class AuthService {
  async checkStatus(): Promise<AuthResponse> {
    const response = await httpService.get<AuthResponse>('/auth/status');
    return response.data;
  }

  async logout(): Promise<void> {
    await httpService.post('/auth/logout');
  }

  getGoogleAuthUrl(returnTo?: string): string {
    const params = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
    return `${API_URL}/auth/google${params}`;
  }
}

export default new AuthService();