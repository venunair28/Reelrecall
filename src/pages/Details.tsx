import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import MovieDetails from '@/components/MovieDetails';

export default function Details() {
  const { loading } = useAuth();

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
      <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full">
        <MovieDetails />
      </main>
    </div>
  );
}
