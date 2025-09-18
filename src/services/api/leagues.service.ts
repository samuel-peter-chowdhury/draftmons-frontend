import httpService from '../http.service';
import { League, LeagueResponse } from '@/types/league.types';

class LeaguesService {
  async getAll(page = 1, pageSize = 10): Promise<LeagueResponse> {
    const response = await httpService.get<LeagueResponse>('/leagues', {
      params: { page, pageSize },
    });
    return response.data;
  }

  async getById(id: string): Promise<League> {
    const response = await httpService.get<League>(`/leagues/${id}`);
    return response.data;
  }

  async create(league: Partial<League>): Promise<League> {
    const response = await httpService.post<League>('/leagues', league);
    return response.data;
  }

  async update(id: string, league: Partial<League>): Promise<League> {
    const response = await httpService.put<League>(`/leagues/${id}`, league);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await httpService.delete(`/leagues/${id}`);
  }

  async getUserLeagues(): Promise<League[]> {
    const response = await httpService.get<League[]>('/leagues/user');
    return response.data;
  }
}

export default new LeaguesService();