import httpService from '../http.service';
import { Pokemon, PokemonResponse } from '@/types/pokemon.types';

class PokemonService {
  async getAll(page = 1, pageSize = 10): Promise<PokemonResponse> {
    const response = await httpService.get<PokemonResponse>('/pokemon', {
      params: { page, pageSize },
    });
    return response.data;
  }

  async getById(id: string): Promise<Pokemon> {
    const response = await httpService.get<Pokemon>(`/pokemon/${id}`);
    return response.data;
  }

  async create(pokemon: Partial<Pokemon>): Promise<Pokemon> {
    const response = await httpService.post<Pokemon>('/pokemon', pokemon);
    return response.data;
  }

  async update(id: string, pokemon: Partial<Pokemon>): Promise<Pokemon> {
    const response = await httpService.put<Pokemon>(`/pokemon/${id}`, pokemon);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await httpService.delete(`/pokemon/${id}`);
  }
}

export default new PokemonService();