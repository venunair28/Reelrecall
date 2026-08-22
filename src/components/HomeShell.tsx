import HeroCarousel from '@/components/HeroCarousel';
import WatchlistRow from '@/components/WatchlistRow';

export default function HomeShell() {
  return (
    <div className="flex-1 flex flex-col gap-6 min-w-0">
      <HeroCarousel />
      <WatchlistRow />
    </div>
  );
}
