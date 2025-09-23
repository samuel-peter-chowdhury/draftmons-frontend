import { BaseInputDto, BaseOutputDto } from '../../dtos/base.dto';
import { PaginatedResponse } from '../../utils/paginatedResponse';
import httpService from '../http.service';

export abstract class BaseService<I extends BaseInputDto, O extends BaseOutputDto> {
  constructor(protected readonly path: string) { }

  async getAll(full: boolean = false, page: number = 1, pageSize: number = 25, where: Partial<O>, sortBy?: string, sortOrder?: 'ASC' | 'DESC'): Promise<PaginatedResponse<I>> {
    const response = await httpService.get<PaginatedResponse<I>>(this.path, {
      params: {
        full,
        page,
        pageSize,
        ...where,
        sortBy,
        sortOrder
      },
    });
    return response.data;
  }

  async getById(id: number, full: boolean = false): Promise<I> {
    const response = await httpService.get<I>(`${this.path}/${String(id)}`, { params: { full } });
    return response.data;
  }

  async create(outputDto: O): Promise<I> {
    const response = await httpService.post<I>(this.path, outputDto);
    return response.data;
  }

  async update(id: number, partialOutputDto: Partial<O>, full: boolean = false): Promise<I> {
    const response = await httpService.put<I>(`${this.path}/${String(id)}`, partialOutputDto, { params: { full } });
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await httpService.delete(`${this.path}/${String(id)}`);
  }
}