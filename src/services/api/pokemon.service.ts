import { PokemonInputDto, PokemonOutputDto } from '../../dtos/pokemon.dto';
import { PaginatedResponse } from '../../utils/paginatedResponse';
import httpService from '../http.service';

class PokemonService {
  async getAll(page = 1, pageSize = 10): Promise<PaginatedResponse<PokemonInputDto>> {
    const response = await httpService.get<PaginatedResponse<PokemonInputDto>>('/pokemon', {
      params: { page, pageSize },
    });
    return response.data;
  }

  async getById(id: string): Promise<PokemonInputDto> {
    const response = await httpService.get<PokemonInputDto>(`/pokemon/${id}`);
    return response.data;
  }

  async create(pokemon: PokemonOutputDto): Promise<PokemonInputDto> {
    const response = await httpService.post<PokemonInputDto>('/pokemon', pokemon);
    return response.data;
  }

  async update(id: string, pokemon: Partial<PokemonOutputDto>): Promise<PokemonInputDto> {
    const response = await httpService.put<PokemonInputDto>(`/pokemon/${id}`, pokemon);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await httpService.delete(`/pokemon/${id}`);
  }
}

export default new PokemonService();