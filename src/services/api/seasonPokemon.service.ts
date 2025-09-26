import {
  SeasonPokemonInputDto,
  SeasonPokemonOutputDto,
} from "../../dtos/seasonPokemon.dto";
import { BaseService } from "./base.service";

class SeasonPokemonService extends BaseService<
  SeasonPokemonInputDto,
  SeasonPokemonOutputDto
> {
  constructor(protected readonly path: string) {
    super(path);
  }
}

export default new SeasonPokemonService("/season-pokemon");
