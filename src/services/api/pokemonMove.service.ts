import {
  PokemonMoveInputDto,
  PokemonMoveOutputDto,
} from "../../dtos/pokemonMove.dto";
import { BaseService } from "./base.service";

class PokemonMoveService extends BaseService<
  PokemonMoveInputDto,
  PokemonMoveOutputDto
> {
  constructor(protected readonly path: string) {
    super(path);
  }
}

export default new PokemonMoveService("/pokemon-move");
