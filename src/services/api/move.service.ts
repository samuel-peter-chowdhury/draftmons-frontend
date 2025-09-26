import { MoveInputDto, MoveOutputDto } from "../../dtos/move.dto";
import { BaseService } from "./base.service";

class MoveService extends BaseService<MoveInputDto, MoveOutputDto> {
  constructor(protected readonly path: string) {
    super(path);
  }
}

export default new MoveService("/move");
