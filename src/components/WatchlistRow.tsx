import { useState, useEffect, useCallback } from 'react';
import { Bookmark, Star, Loader2, Plus, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useDragContext } from '@/context/DragContext';
import { addToWatchlist, sortWatchlist } from '@/lib/watchlist';
import type { WatchlistItem } from '@/types';

const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p';

export default function WatchlistRow() {
  const { user } = useAuth();
  const { getDragData } = useDragContext();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [flash, setFlash] = useState(false);

  const loadWatchlist = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('watchlist')
      .select('id, user_id, tmdb_id, title, poster_path, year, genre, tmdb_rating, personal_rating, added_at')
      .eq('user_id', user.id);
    if (!error && data) setItems(sortWatchlist(data as WatchlistItem[]));
    setLoading(false);
  }, [user]);

  useEffect(() => { loadWatchlist(); }, [loadWatchlist]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dragData = getDragData();
    if (!dragData || !user) return;

    const { error } = await addToWatchlist(user.id, {
      tmdb_id: dragData.tmdb_id,
      title: dragData.title,
      poster_path: dragData.poster_path,
      year: dragData.year,
      genre: dragData.genre,
      tmdb_rating: dragData.tmdb_rating,
    });
    if (!error) {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 1500);
      loadWatchlist();
    }
  }, [getDragData, user, loadWatchlist]);

  return (
    <div
      className={`rounded-3xl bg-navy-900/60 border p-6 transition-colors ${
        dragOver ? 'border-accent-purple/50 bg-accent-purple/5' : 'border-white/5'
      } ${flash ? 'ring-2 ring-emerald-500/40' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-2 mb-4">
        <Bookmark className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-300">Watchlist</span>
        {items.length > 0 && (
          <span className="ml-auto text-xs text-slate-500">{items.length} {items.length === 1 ? 'movie' : 'movies'}</span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-accent-purple" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-center gap-2">
          <div className="w-12 h-12 rounded-full bg-navy-850 flex items-center justify-center">
            {dragOver ? <Plus className="w-5 h-5 text-accent-purple" /> : <Plus className="w-5 h-5 text-slate-500" />}
          </div>
          <p className="text-sm text-slate-500">Your watchlist is empty</p>
          <p className="text-xs text-slate-600">
            {dragOver ? 'Drop to add' : 'Search for a movie to add one'}
          </p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="shrink-0 w-28 group cursor-default"
            >
              <div className="w-28 h-40 rounded-xl bg-navy-850 overflow-hidden border border-white/5 relative">
                {item.poster_path ? (
                  <img
                    src={`${TMDB_IMG_BASE}/w200${item.poster_path}`}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs text-slate-600 text-center px-2">{item.title}</span>
                  </div>
                )}
                {item.personal_rating && (
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-navy-950/80 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                    <Star className="w-2.5 h-2.5 text-amber-400" />
                    <span className="text-[10px] text-amber-300 font-medium">{item.personal_rating}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1.5 truncate">{item.title}</p>
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                {item.year && <span>{item.year}</span>}
                {item.personal_rating ? (
                  <span className="flex items-center gap-0.5 text-amber-400">
                    <Check className="w-2.5 h-2.5" />
                    Rated
                  </span>
                ) : (
                  <span className="text-slate-600">Unrated</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
