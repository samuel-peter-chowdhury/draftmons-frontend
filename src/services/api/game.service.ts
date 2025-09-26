import { GameInputDto, GameOutputDto } from "../../dtos/game.dto";
import { BaseService } from "./base.service";

class GameService extends BaseService<GameInputDto, GameOutputDto> {
  constructor(protected readonly path: string) {
    super(path);
  }
}

export default new GameService("/game");
