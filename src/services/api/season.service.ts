import { SeasonInputDto, SeasonOutputDto } from "../../dtos/season.dto";
import { BaseService } from "./base.service";

class SeasonService extends BaseService<SeasonInputDto, SeasonOutputDto> {
  constructor(protected readonly path: string) {
    super(path);
  }
}

export default new SeasonService("/season");
