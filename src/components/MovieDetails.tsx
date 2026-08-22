import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, Plus, Check, Trash2, Loader2, Star as StarOutline, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { addToWatchlist, removeFromWatchlist, rateMovie, checkInWatchlist } from '@/lib/watchlist';
import type { WatchlistItem } from '@/types';

const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p';

type MovieData = {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  year: string | null;
  genre: string | null;
  tmdb_rating: number;
  original_language: string;
};

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [movie, setMovie] = useState<MovieData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistItem, setWatchlistItem] = useState<WatchlistItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showRateOverlay, setShowRateOverlay] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [savingRating, setSavingRating] = useState(false);

  const tmdbId = id ? parseInt(id, 10) : 0;

  const fetchMovie = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/tmdb-proxy?action=movie&id=${tmdbId}`, {
        headers: {
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!data.movie) throw new Error('Movie not found');
      setMovie(data.movie as MovieData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load movie details');
    } finally {
      setLoading(false);
    }
  }, [tmdbId]);

  const checkStatus = useCallback(async () => {
    if (!user) return;
    const { inWatchlist: found, item } = await checkInWatchlist(user.id, tmdbId);
    setInWatchlist(found);
    setWatchlistItem(item);
    if (item?.personal_rating) setSelectedRating(item.personal_rating);
  }, [user, tmdbId]);

  useEffect(() => { fetchMovie(); }, [fetchMovie]);
  useEffect(() => { checkStatus(); }, [checkStatus]);

  const handleAdd = useCallback(async () => {
    if (!user || !movie) return;
    setAdding(true);
    const { data, error } = await addToWatchlist(user.id, {
      tmdb_id: movie.tmdb_id,
      title: movie.title,
      poster_path: movie.poster_path,
      year: movie.year ? parseInt(movie.year, 10) : null,
      genre: movie.genre,
      tmdb_rating: movie.tmdb_rating,
    });
    setAdding(false);
    if (!error) {
      setInWatchlist(true);
      setWatchlistItem(data);
    }
  }, [user, movie]);

  const handleRemove = useCallback(async () => {
    if (!user) return;
    setRemoving(true);
    const { error } = await removeFromWatchlist(user.id, tmdbId);
    setRemoving(false);
    if (!error) {
      setInWatchlist(false);
      setWatchlistItem(null);
      setSelectedRating(0);
    }
  }, [user, tmdbId]);

  const handleSaveRating = useCallback(async () => {
    if (!user || selectedRating === 0) return;
    setSavingRating(true);
    const { data, error } = await rateMovie(user.id, tmdbId, selectedRating);
    setSavingRating(false);
    if (!error && data) {
      setWatchlistItem(data);
      setShowRateOverlay(false);
    }
  }, [user, tmdbId, selectedRating]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-accent-purple" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <p className="text-sm text-slate-500">{error || 'Movie not found'}</p>
        <button onClick={() => navigate('/home')} className="text-sm text-accent-purple/80 hover:text-accent-purple transition">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <button
        onClick={() => navigate('/home')}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="rounded-3xl bg-navy-900/60 border border-white/5 overflow-hidden">
        {movie.backdrop_path && (
          <div className="relative h-48 md:h-64">
            <img
              src={`${TMDB_IMG_BASE}/w780${movie.backdrop_path}`}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-900 to-transparent" />
          </div>
        )}
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-32 h-48 md:w-40 md:h-60 rounded-2xl overflow-hidden shrink-0 border border-white/5 bg-navy-850">
              {movie.poster_path ? (
                <img
                  src={`${TMDB_IMG_BASE}/w300${movie.poster_path}`}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs text-slate-600 text-center px-2">{movie.title}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-100 mb-2">{movie.title}</h1>
              <div className="flex items-center gap-3 text-sm text-slate-400 mb-4">
                {movie.year && <span>{movie.year}</span>}
                {movie.genre && <span>{movie.genre}</span>}
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-200">{movie.tmdb_rating.toFixed(1)}</span>
                  <span className="text-slate-500 text-xs ml-0.5">TMDB Rating</span>
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-2xl mb-5">{movie.overview}</p>

              {watchlistItem?.personal_rating != null && (
                <div className="mb-4 p-3 rounded-xl bg-navy-850/60 border border-white/5">
                  <p className="text-xs text-slate-500 mb-1.5">Your Rating</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= watchlistItem.personal_rating! ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                {!inWatchlist ? (
                  <button
                    onClick={handleAdd}
                    disabled={adding}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-accent text-white font-medium text-sm shadow-glow-purple hover:opacity-90 disabled:opacity-50 transition"
                  >
                    {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add to Watchlist
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => { setSelectedRating(watchlistItem?.personal_rating ?? 0); setShowRateOverlay(true); }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-850 border border-white/10 text-slate-200 font-medium text-sm hover:border-accent-purple/40 transition"
                    >
                      <StarOutline className="w-4 h-4" />
                      {watchlistItem?.personal_rating ? 'Change Rating' : 'Rate'}
                    </button>
                    <button
                      onClick={handleRemove}
                      disabled={removing}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-medium text-sm hover:bg-rose-500/20 disabled:opacity-50 transition"
                    >
                      {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Remove
                    </button>
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      In Watchlist
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRateOverlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowRateOverlay(false)}
        >
          <div
            className="bg-navy-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-100">Rate this movie</h3>
              <button onClick={() => setShowRateOverlay(false)} className="text-slate-500 hover:text-slate-300 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-400 mb-4 text-center">{movie.title}</p>

            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setSelectedRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoverRating || selectedRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRateOverlay(false)}
                className="flex-1 py-2.5 rounded-xl bg-navy-850 border border-white/5 text-slate-400 text-sm font-medium hover:text-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRating}
                disabled={selectedRating === 0 || savingRating}
                className="flex-1 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium shadow-glow-purple hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {savingRating && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
