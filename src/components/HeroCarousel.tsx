import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Star, Loader2, Flame, Plus, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TrendingMovie } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { addToWatchlist, checkInWatchlist } from '@/lib/watchlist';
import { useDragContext, type DragMovieData } from '@/context/DragContext';

const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p';

export default function HeroCarousel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setDragData } = useDragContext();
  const [movies, setMovies] = useState<TrendingMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchTrending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/tmdb-proxy?action=trending`, {
        headers: {
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!Array.isArray(data.movies)) throw new Error('Unexpected response shape');
      setMovies(data.movies as TrendingMovie[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trending movies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTrending(); }, [fetchTrending]);

  useEffect(() => {
    if (movies.length <= 1) return;
    const timer = window.setInterval(() => setCurrent((c) => (c + 1) % movies.length), 6000);
    return () => window.clearInterval(timer);
  }, [movies.length]);

  const movie = movies[current];

  const checkWatchlistStatus = useCallback(async (tmdbId: number) => {
    if (!user) return;
    const { inWatchlist: found } = await checkInWatchlist(user.id, tmdbId);
    setInWatchlist(found);
  }, [user]);

  useEffect(() => {
    if (movie) {
      setInWatchlist(false);
      checkWatchlistStatus(movie.tmdb_id);
    }
  }, [movie, checkWatchlistStatus]);

  const goPrev = useCallback(() => setCurrent((c) => (c - 1 + movies.length) % movies.length), [movies.length]);
  const goNext = useCallback(() => setCurrent((c) => (c + 1) % movies.length), [movies.length]);

  const handleAdd = useCallback(async () => {
    if (!user || !movie) return;
    setAdding(true);
    const { error } = await addToWatchlist(user.id, {
      tmdb_id: movie.tmdb_id,
      title: movie.title,
      poster_path: movie.poster_path,
      year: movie.year ? parseInt(movie.year, 10) : null,
      genre: null,
      tmdb_rating: movie.tmdb_rating,
    });
    setAdding(false);
    if (!error) setInWatchlist(true);
  }, [user, movie]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (!movie) return;
    const dragData: DragMovieData = {
      tmdb_id: movie.tmdb_id,
      title: movie.title,
      poster_path: movie.poster_path,
      year: movie.year ? parseInt(movie.year, 10) : null,
      genre: null,
      tmdb_rating: movie.tmdb_rating,
    };
    setDragData(dragData);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', movie.title);
  }, [movie, setDragData]);

  const handleDragEnd = useCallback(() => {
    setDragData(null);
  }, [setDragData]);

  if (loading) {
    return (
      <div className="rounded-3xl bg-navy-900/60 border border-white/5 p-6 flex-1 min-h-[320px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-purple" />
      </div>
    );
  }

  if (error || movies.length === 0) {
    return (
      <div className="rounded-3xl bg-navy-900/60 border border-white/5 p-6 flex-1 min-h-[320px] flex flex-col items-center justify-center gap-2">
        <Flame className="w-8 h-8 text-slate-600" />
        <p className="text-sm text-slate-500">{error ? 'Unable to load trending movies' : 'No trending movies found'}</p>
        <button onClick={fetchTrending} className="text-xs text-accent-purple/80 hover:text-accent-purple transition">Try again</button>
      </div>
    );
  }

  return (
    <div
      className="rounded-3xl bg-navy-900/60 border border-white/5 overflow-hidden flex-1 min-h-[320px] relative group cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDoubleClick={() => navigate(`/movie/${movie.tmdb_id}`)}
    >
      <div className="relative h-full min-h-[320px]">
        {movie.backdrop_path && (
          <img
            src={`${TMDB_IMG_BASE}/w1280${movie.backdrop_path}`}
            alt={movie.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950/80 via-transparent to-transparent" />

        <div className="relative h-full flex flex-col justify-end p-6 md:p-8">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-xs uppercase tracking-wider text-slate-400">Trending Now</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{movie.title}</h2>
          <div className="flex items-center gap-3 text-sm text-slate-300 mb-3">
            {movie.year && <span>{movie.year}</span>}
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-200">{movie.tmdb_rating.toFixed(1)}</span>
              <span className="text-slate-500 text-xs ml-0.5">TMDB Rating</span>
            </span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xl line-clamp-2 mb-4">{movie.overview}</p>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAdd}
              disabled={adding || inWatchlist}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                inWatchlist
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'gradient-accent text-white shadow-glow-purple hover:opacity-90'
              }`}
            >
              {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {inWatchlist ? 'Added' : 'Add to Watchlist'}
            </button>
            <span className="text-xs text-slate-600">Drag to watchlist or double-click for details</span>
          </div>
        </div>
      </div>

      {movies.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-navy-950/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-slate-300 hover:bg-navy-800 hover:text-white transition opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-navy-950/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-slate-300 hover:bg-navy-800 hover:text-white transition opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {movies.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === current ? 'w-6 bg-accent-purple' : 'w-1.5 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
