import { LeagueInputDto, LeagueOutputDto } from '../../dtos/league.dto';
import { BaseService } from './base.service';

class LeagueService extends BaseService<LeagueInputDto, LeagueOutputDto> {
  constructor(protected readonly path: string) {
    super(path);
  }
}

export default new LeagueService('/league');