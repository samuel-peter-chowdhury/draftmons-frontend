import {
  PokemonTypeInputDto,
  PokemonTypeOutputDto,
} from "../../dtos/pokemonType.dto";
import { BaseService } from "./base.service";

class PokemonTypeService extends BaseService<
  PokemonTypeInputDto,
  PokemonTypeOutputDto
> {
  constructor(protected readonly path: string) {
    super(path);
  }
}

export default new PokemonTypeService("/pokemon-type");
