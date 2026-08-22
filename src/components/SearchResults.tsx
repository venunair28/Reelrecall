import { Search, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TrendingMovie } from '@/types';

const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p';

type SearchResultsProps = {
  movies: TrendingMovie[];
  query: string;
  onClear: () => void;
};

export default function SearchResults({ movies, query, onClear }: SearchResultsProps) {
  const navigate = useNavigate();

  return (
    <section className="rounded-3xl bg-navy-900/60 border border-white/5 p-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Search results</p>
          <h2 className="text-xl font-semibold text-slate-100 mt-1">For &ldquo;{query}&rdquo;</h2>
        </div>
        <button onClick={onClear} className="text-xs text-slate-500 hover:text-slate-200 transition">
          Clear
        </button>
      </div>

      {movies.length === 0 ? (
        <div className="py-12 text-center">
          <Search className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No matching movies found.</p>
          <p className="text-xs text-slate-600 mt-1">Try describing a different detail or mood.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {movies.map((movie) => (
            <button key={movie.tmdb_id} onClick={() => navigate(`/movie/${movie.tmdb_id}`)} className="text-left group">
              <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-navy-850 border border-white/5 mb-2">
                {movie.poster_path ? (
                  <img
                    src={`${TMDB_IMG_BASE}/w300${movie.poster_path}`}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center px-3 text-center text-xs text-slate-600">
                    {movie.title}
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-200 truncate group-hover:text-white transition">{movie.title}</p>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                {movie.year && <span>{movie.year}</span>}
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400" />
                  {movie.tmdb_rating.toFixed(1)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
