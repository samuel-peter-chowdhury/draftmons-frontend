import { GenerationInputDto, GenerationOutputDto } from '../../dtos/generation.dto';
import { BaseService } from './base.service';

class GenerationService extends BaseService<GenerationInputDto, GenerationOutputDto> {
  constructor(protected readonly path: string) {
    super(path);
  }
}

export default new GenerationService('/generation');