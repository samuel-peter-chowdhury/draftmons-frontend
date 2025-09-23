import { TypeEffectiveInputDto, TypeEffectiveOutputDto } from '../../dtos/typeEffective.dto';
import { BaseService } from './base.service';

class TypeEffectiveService extends BaseService<TypeEffectiveInputDto, TypeEffectiveOutputDto> {
  constructor(protected readonly path: string) {
    super(path);
  }
}

export default new TypeEffectiveService('/type-effective');