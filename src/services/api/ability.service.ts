import { AbilityInputDto, AbilityOutputDto } from '../../dtos/ability.dto';
import { BaseService } from './base.service';

class AbilityService extends BaseService<AbilityInputDto, AbilityOutputDto> {
  constructor(protected readonly path: string) {
    super(path);
  }
}

export default new AbilityService('/ability');