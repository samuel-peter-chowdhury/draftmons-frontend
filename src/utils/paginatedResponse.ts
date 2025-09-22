import { BaseInputDto } from "../dtos/base.dto";

export interface PaginatedResponse<I extends BaseInputDto> {
  data: I[];
  total: number;
  page: number;
  pageSize: number;
}