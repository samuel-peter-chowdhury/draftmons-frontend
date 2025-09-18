export interface League {
  id: string;
  name: string;
}

export interface LeagueResponse {
  data: League[];
  total: number;
  page: number;
  pageSize: number;
}