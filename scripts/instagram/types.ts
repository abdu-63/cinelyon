export interface SelectedFilm {
  title: string;
  year: number;
  director: string;
  note: number;
  score: number;
  senscritique_rank: number;
}

export interface Cinema {
  name: string;
  address: string;
  showtimes: string[];
  passes: string[];
}

export interface EnrichedFilm {
  title: string;
  director: string;
  year: number;
  poster_url: string;
  cinema: Cinema[];
  tmdb_id?: number | string;
  synopsis?: string;
  overview?: string;
  description?: string;
}