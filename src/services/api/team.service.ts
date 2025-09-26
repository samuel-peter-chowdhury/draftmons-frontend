import { TeamInputDto, TeamOutputDto } from "../../dtos/team.dto";
import { BaseService } from "./base.service";

class TeamService extends BaseService<TeamInputDto, TeamOutputDto> {
  constructor(protected readonly path: string) {
    super(path);
  }
}

export default new TeamService("/team");
