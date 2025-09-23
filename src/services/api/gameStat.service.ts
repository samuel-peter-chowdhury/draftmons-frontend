import { GameStatInputDto, GameStatOutputDto } from '../../dtos/gameStat.dto';
import { BaseService } from './base.service';

class GameStatService extends BaseService<GameStatInputDto, GameStatOutputDto> {
  constructor(protected readonly path: string) {
    super(path);
  }
}

export default new GameStatService('/game-stat');