import httpService from '../http.service';
import { UserProfile } from '@/types/user.types';

class UsersService {
  async getProfile(): Promise<UserProfile> {
    const response = await httpService.get<UserProfile>('/users/profile');
    return response.data;
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const response = await httpService.put<UserProfile>('/users/profile', profile);
    return response.data;
  }
}

export default new UsersService();