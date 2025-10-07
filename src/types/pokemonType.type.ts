import { BaseInputDto, BaseOutputDto } from './base.type';
import { MoveInputDto } from './move.type';
import { PokemonInputDto } from './pokemon.type';
import { TypeEffectiveInputDto } from './typeEffective.type';

export interface PokemonTypeInputDto extends BaseInputDto {
  name: string;
  color: string;
  moves?: MoveInputDto[];
  pokemon?: PokemonInputDto[];
  typeEffectiveness?: TypeEffectiveInputDto[];
}

export interface PokemonTypeOutputDto extends BaseOutputDto {
  name: string;
  color: string;
}
