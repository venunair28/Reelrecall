import { useState } from 'react';
import { Loader as Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import HomeShell from '@/components/HomeShell';
import type { TrendingMovie } from '@/types';

export default function Home() {
  const { loading, session } = useAuth();
  const [searchResults, setSearchResults] = useState<TrendingMovie[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  async function handleSearch(query: string, mood?: string) {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-search`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, mood }),
      });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.movies)) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Search failed');
      }
      setSearchResults(data.movies as TrendingMovie[]);
      setSearchQuery(mood ? `${mood} movies` : query);
    } catch {
      setSearchResults([]);
      setSearchQuery(mood ? `${mood} movies` : query);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <Loader2 className="w-8 h-8 animate-spin text-accent-purple" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-navy-950">
      <Header />
      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 max-w-[1600px] mx-auto w-full">
        <Sidebar onSearch={handleSearch} />
        <HomeShell
          searchResults={searchResults}
          searchQuery={searchQuery}
          onClearSearch={() => setSearchResults(null)}
        />
      </main>
    </div>
  );
}
