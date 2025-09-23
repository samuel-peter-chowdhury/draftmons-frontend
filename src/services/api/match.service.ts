import { MatchInputDto, MatchOutputDto } from '../../dtos/match.dto';
import { BaseService } from './base.service';

class MatchService extends BaseService<MatchInputDto, MatchOutputDto> {
  constructor(protected readonly path: string) {
    super(path);
  }
}

export default new MatchService('/match');