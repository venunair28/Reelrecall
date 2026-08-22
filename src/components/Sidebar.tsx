import { useState } from 'react';
import { Search, ImagePlus, Sparkles, X } from 'lucide-react';
import type { SearchMode } from '@/types';

const MODE_CHIPS: SearchMode[] = ['Title', 'Actor', 'Story', 'Scene', 'Quote', 'Genre', 'Year', 'Image'];
const MOOD_BUTTONS = ['Laugh', 'Think', 'Romance', 'Scare Me'] as const;
const HINTS = ['Leo + dreams', 'movie where a man repeats a day'];

export default function Sidebar() {
  const [query, setQuery] = useState('');
  const [activeMode, setActiveMode] = useState<SearchMode>('Title');
  const [fileName, setFileName] = useState<string | null>(null);
  const [comingSoon, setComingSoon] = useState<string | null>(null);

  function showComingSoon(label: string) {
    setComingSoon(label);
    window.setTimeout(() => setComingSoon(null), 2000);
  }

  function handleFile(file: File | undefined) {
    if (file) setFileName(file.name);
  }

  return (
    <aside className="w-full lg:w-96 shrink-0 flex flex-col gap-4">
      <div className="rounded-3xl bg-navy-900/60 border border-white/5 p-6">
        <h1 className="text-2xl font-bold gradient-text mb-1">REELRECALL</h1>
        <p className="text-sm text-slate-400 mb-5">You remember the movie. We find it.</p>

        <h2 className="text-lg font-semibold text-slate-200 mb-3">What do you remember?</h2>

        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && showComingSoon('Search')}
            placeholder="Describe the movie you remember…"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-navy-850 border border-white/5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent-purple/50 focus:ring-2 focus:ring-accent-purple/20 transition"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {MODE_CHIPS.map((mode) => (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeMode === mode
                  ? 'gradient-accent text-white shadow-glow-purple'
                  : 'bg-navy-850 text-slate-400 hover:text-slate-200 hover:border-accent-purple/30 border border-white/5'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div
          className="relative rounded-2xl border-2 border-dashed border-white/10 bg-navy-850/50 p-4 mb-4 transition-colors hover:border-accent-purple/30"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files[0]);
          }}
        >
          <label className="flex flex-col items-center gap-2 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-navy-800 flex items-center justify-center">
              <ImagePlus className="w-5 h-5 text-slate-400" />
            </div>
            {fileName ? (
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <span className="truncate max-w-[160px]">{fileName}</span>
                <button
                  onClick={(e) => { e.preventDefault(); setFileName(null); }}
                  className="text-slate-500 hover:text-rose-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center">
                Drop a screenshot or still, or <span className="text-accent-purple/80">browse</span>
              </p>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? undefined)}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {HINTS.map((hint) => (
            <button
              key={hint}
              onClick={() => { setQuery(hint); showComingSoon('Search'); }}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-500 bg-navy-850/50 border border-white/5 hover:text-slate-300 hover:border-accent-purple/20 transition"
            >
              "{hint}"
            </button>
          ))}
        </div>

        <button
          onClick={() => showComingSoon('Search')}
          className="w-full py-3 rounded-xl gradient-accent text-white font-medium text-sm shadow-glow-purple hover:opacity-90 transition flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Find My Movie
        </button>

        {comingSoon && (
          <p className="text-xs text-center text-slate-500 mt-3 animate-fade-in">
            {comingSoon} is coming in Sprint 2
          </p>
        )}
      </div>

      <div className="rounded-3xl bg-navy-900/60 border border-white/5 p-5">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Mood</h3>
        <div className="grid grid-cols-2 gap-2">
          {MOOD_BUTTONS.map((mood) => (
            <button
              key={mood}
              onClick={() => showComingSoon(mood)}
              className="py-2.5 rounded-xl bg-navy-850 border border-white/5 text-sm text-slate-400 hover:text-slate-200 hover:border-accent-purple/30 hover:bg-navy-800 transition-all"
            >
              {mood}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
