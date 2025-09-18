export interface Pokemon {
  id: string;
  name: string;
  image?: string;
  types?: string[];
  abilities?: string[];
  team?: string;
  hp?: number;
  atk?: number;
  def?: number;
  spa?: number;
  spd?: number;
  spe?: number;
  bst?: number;
  pts?: number;
}

export interface PokemonResponse {
  data: Pokemon[];
  total: number;
  page: number;
  pageSize: number;
}