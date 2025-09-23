import { PokemonInputDto, PokemonOutputDto } from '../../dtos/pokemon.dto';
import { BaseService } from './base.service';

class PokemonService extends BaseService<PokemonInputDto, PokemonOutputDto> {
  constructor(protected readonly path: string) {
    super(path);
  }
}

export default new PokemonService('/pokemon');