import HeroCarousel from '@/components/HeroCarousel';
import WatchlistRow from '@/components/WatchlistRow';
import SearchResults from '@/components/SearchResults';
import type { TrendingMovie } from '@/types';

type HomeShellProps = {
  searchResults: TrendingMovie[] | null;
  searchQuery: string;
  onClearSearch: () => void;
};

export default function HomeShell({ searchResults, searchQuery, onClearSearch }: HomeShellProps) {
  return (
    <div className="flex-1 flex flex-col gap-6 min-w-0">
      {searchResults ? (
        <SearchResults movies={searchResults} query={searchQuery} onClear={onClearSearch} />
      ) : (
        <HeroCarousel />
      )}
      <WatchlistRow />
    </div>
  );
}
