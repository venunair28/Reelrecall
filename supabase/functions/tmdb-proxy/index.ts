import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TMDB_BASE = "https://api.themoviedb.org/3";
const ALLOWED_LANGUAGES = ["en", "hi"];

interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string | null;
  genre_ids: number[];
  vote_average: number;
  popularity: number;
  original_language: string;
}

interface TrendingMovie {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  year: string | null;
  genre_ids: number[];
  tmdb_rating: number;
  popularity: number;
  original_language: string;
}

interface MovieDetails {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  year: string | null;
  genre: string | null;
  tmdb_rating: number;
  original_language: string;
}

const GENRE_MAP: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  53: "Thriller", 10752: "War", 37: "Western",
};

async function fetchMovieDetails(apiKey: string, movieId: number): Promise<MovieDetails> {
  const url = `${TMDB_BASE}/movie/${movieId}?api_key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB responded ${res.status}`);
  const m = await res.json();
  if (!ALLOWED_LANGUAGES.includes(m.original_language)) {
    throw new Error("This movie is not available in English or Hindi original language");
  }
  const genres = (m.genres ?? []).map((g: { id: number }) => GENRE_MAP[g.id]).filter(Boolean);
  return {
    tmdb_id: m.id,
    title: m.title,
    poster_path: m.poster_path,
    backdrop_path: m.backdrop_path,
    overview: m.overview,
    year: m.release_date ? m.release_date.slice(0, 4) : null,
    genre: genres.length > 0 ? genres.slice(0, 3).join(", ") : null,
    tmdb_rating: m.vote_average,
    original_language: m.original_language,
  };
}

async function fetchDiscover(apiKey: string, language: string): Promise<TMDBMovie[]> {
  const url = `${TMDB_BASE}/discover/movie?api_key=${apiKey}&with_original_language=${language}&sort_by=popularity.desc&page=1&vote_count.gte=50`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB responded ${res.status}`);
  const data = await res.json();
  return (data.results ?? []) as TMDBMovie[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const tmdbApiKey = Deno.env.get("TMDB_API_KEY");
    if (!tmdbApiKey) {
      return new Response(JSON.stringify({ error: "TMDB API key not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/tmdb-proxy\/?/, "");
    const action = path || url.searchParams.get("action") || "trending";

    if (action === "trending" || action === "") {
      const [enResults, hiResults] = await Promise.all([
        fetchDiscover(tmdbApiKey, "en"),
        fetchDiscover(tmdbApiKey, "hi"),
      ]);

      const merged: TrendingMovie[] = [...enResults, ...hiResults]
        .filter((m) => ALLOWED_LANGUAGES.includes(m.original_language))
        .map((m) => ({
          tmdb_id: m.id,
          title: m.title,
          poster_path: m.poster_path,
          backdrop_path: m.backdrop_path,
          overview: m.overview,
          year: m.release_date ? m.release_date.slice(0, 4) : null,
          genre_ids: m.genre_ids ?? [],
          tmdb_rating: m.vote_average,
          popularity: m.popularity,
          original_language: m.original_language,
        }))
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 5);

      return new Response(JSON.stringify({ movies: merged }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "movie") {
      const movieId = parseInt(url.searchParams.get("id") || "", 10);
      if (!movieId) {
        return new Response(JSON.stringify({ error: "Missing movie id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const details = await fetchMovieDetails(tmdbApiKey, movieId);
      return new Response(JSON.stringify({ movie: details }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
