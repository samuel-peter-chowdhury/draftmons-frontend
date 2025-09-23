import { LeagueUserInputDto, LeagueUserOutputDto } from '../../dtos/leagueUser.dto';
import { BaseService } from './base.service';

class LeagueUserService extends BaseService<LeagueUserInputDto, LeagueUserOutputDto> {
  constructor(protected readonly path: string) {
    super(path);
  }
}

export default new LeagueUserService('/league-user');