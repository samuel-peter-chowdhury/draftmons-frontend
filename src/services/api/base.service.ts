import { BaseInputDto, BaseOutputDto } from "../../dtos/base.dto";
import { PaginatedResponse } from "../../utils/paginatedResponse";
import httpService from "../http.service";

export abstract class BaseService<
  I extends BaseInputDto,
  O extends BaseOutputDto
> {
  constructor(protected readonly path: string) {}

  async getAll(
    full?: boolean,
    page?: number,
    pageSize?: number,
    where?: any,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC"
  ): Promise<PaginatedResponse<I>> {
    const response = await httpService.get<PaginatedResponse<I>>(this.path, {
      params: {
        full,
        page,
        pageSize,
        ...where,
        sortBy,
        sortOrder,
      },
    });
    return response.data;
  }

  async getById(id: string, full?: boolean): Promise<I> {
    const response = await httpService.get<I>(`${this.path}/${id}`, {
      params: { full },
    });
    return response.data;
  }

  async create(outputDto: O): Promise<I> {
    const response = await httpService.post<I>(this.path, outputDto);
    return response.data;
  }

  async update(
    id: string,
    partialOutputDto: Partial<O>,
    full?: boolean
  ): Promise<I> {
    const response = await httpService.put<I>(
      `${this.path}/${id}`,
      partialOutputDto,
      { params: { full } }
    );
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await httpService.delete(`${this.path}/${id}`);
  }
}
