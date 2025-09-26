import { WeekInputDto, WeekOutputDto } from "../../dtos/week.dto";
import { BaseService } from "./base.service";

class WeekService extends BaseService<WeekInputDto, WeekOutputDto> {
  constructor(protected readonly path: string) {
    super(path);
  }
}

export default new WeekService("/week");
