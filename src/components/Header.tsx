import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initial = (profile?.display_name || user?.email || 'U').charAt(0).toUpperCase();
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-navy-950/80 backdrop-blur-xl border-b border-white/5">
      <button onClick={() => navigate('/')} className="flex items-center gap-2.5 group">
        <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center shadow-glow-purple group-hover:scale-105 transition-transform">
          <Film className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-semibold gradient-text">ReelRecall</span>
      </button>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full bg-navy-850 border border-white/5 hover:border-accent-purple/40 transition"
        >
          <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-sm font-semibold text-white">
            {initial}
          </div>
          <span className="text-sm text-slate-200 max-w-[120px] truncate">{displayName}</span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-navy-900 border border-white/10 shadow-2xl overflow-hidden animate-fade-in">
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-sm font-medium text-slate-100 truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={async () => { await signOut(); navigate('/'); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-navy-850 hover:text-rose-300 transition"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
