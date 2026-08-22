import { supabase } from '@/lib/supabase';
import type { WatchlistItem } from '@/types';

export type WatchlistInput = {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  year: number | null;
  genre: string | null;
  tmdb_rating: number | null;
};

export async function addToWatchlist(
  userId: string,
  movie: WatchlistInput
): Promise<{ data: WatchlistItem | null; error: string | null }> {
  const { data, error } = await supabase
    .from('watchlist')
    .upsert(
      {
        user_id: userId,
        tmdb_id: movie.tmdb_id,
        title: movie.title,
        poster_path: movie.poster_path,
        year: movie.year,
        genre: movie.genre,
        tmdb_rating: movie.tmdb_rating,
      },
      { onConflict: 'user_id,tmdb_id' }
    )
    .select('id, user_id, tmdb_id, title, poster_path, year, genre, tmdb_rating, personal_rating, added_at')
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data: data as WatchlistItem | null, error: null };
}

export async function removeFromWatchlist(
  userId: string,
  tmdbId: number
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId);
  return { error: error?.message ?? null };
}

export async function rateMovie(
  userId: string,
  tmdbId: number,
  rating: number
): Promise<{ data: WatchlistItem | null; error: string | null }> {
  const { data, error } = await supabase
    .from('watchlist')
    .update({ personal_rating: rating })
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId)
    .select('id, user_id, tmdb_id, title, poster_path, year, genre, tmdb_rating, personal_rating, added_at')
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data: data as WatchlistItem | null, error: null };
}

export async function checkInWatchlist(
  userId: string,
  tmdbId: number
): Promise<{ inWatchlist: boolean; item: WatchlistItem | null }> {
  const { data } = await supabase
    .from('watchlist')
    .select('id, user_id, tmdb_id, title, poster_path, year, genre, tmdb_rating, personal_rating, added_at')
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId)
    .maybeSingle();
  return { inWatchlist: !!data, item: data as WatchlistItem | null };
}

export function sortWatchlist(items: WatchlistItem[]): WatchlistItem[] {
  return [...items].sort((a, b) => {
    const aRated = a.personal_rating != null;
    const bRated = b.personal_rating != null;
    if (aRated && bRated) return (b.personal_rating! - a.personal_rating!);
    if (aRated && !bRated) return -1;
    if (!aRated && bRated) return 1;
    return new Date(b.added_at).getTime() - new Date(a.added_at).getTime();
  });
}
