export type Profile = {
  id: string;
  display_name: string | null;
  created_at: string;
};

export type WatchlistItem = {
  id: string;
  user_id: string;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  year: number | null;
  genre: string | null;
  tmdb_rating: number | null;
  personal_rating: number | null;
  added_at: string;
};

export type TrendingMovie = {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  year: string | null;
  genre_ids: number[];
  tmdb_rating: number;
  popularity: number;
  original_language: string;
};

export type SearchMode =
  | 'Title'
  | 'Actor'
  | 'Story'
  | 'Scene'
  | 'Quote'
  | 'Genre'
  | 'Year'
  | 'Image';
