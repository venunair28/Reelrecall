import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TMDB_BASE = "https://api.themoviedb.org/3";
const GEMINI_MODEL = "gemini-2.0-flash";

const MOOD_GENRES: Record<string, number[]> = {
  Laugh: [35],
  Think: [18, 9648, 53],
  Romance: [10749, 18],
  "Scare Me": [27, 53, 9648],
};

type SearchMovie = {
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
};

async function searchMovies(apiKey: string, query: string, genreIds: number[]): Promise<SearchMovie[]> {
  const params = new URLSearchParams({ api_key: apiKey, query, include_adult: "false", page: "1" });
  const response = await fetch(`${TMDB_BASE}/search/movie?${params}`);
  if (!response.ok) throw new Error("Movie search failed");
  const data = await response.json();
  let results = (data.results ?? []).filter((m: { original_language?: string }) => m.original_language === "en" || m.original_language === "hi");

  if (genreIds.length > 0) {
    const genreFiltered = results.filter((m: { genre_ids?: number[] }) => (m.genre_ids ?? []).some((id: number) => genreIds.includes(id)));
    if (genreFiltered.length > 0) results = genreFiltered;
  }

  return results.slice(0, 8).map((m: { id: number; title: string; poster_path: string | null; backdrop_path: string | null; overview: string; release_date: string | null; genre_ids: number[]; vote_average: number; popularity: number; original_language: string }) => ({
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
  }));
}

async function discoverByGenre(apiKey: string, genreIds: number[]): Promise<SearchMovie[]> {
  const genreStr = genreIds.join(",");
  const params = new URLSearchParams({ api_key: apiKey, with_genres: genreStr, sort_by: "popularity.desc", page: "1", "vote_count.gte": "50" });
  const response = await fetch(`${TMDB_BASE}/discover/movie?${params}`);
  if (!response.ok) throw new Error("Movie search failed");
  const data = await response.json();
  return (data.results ?? []).filter((m: { original_language?: string }) => m.original_language === "en" || m.original_language === "hi").slice(0, 8).map((m: { id: number; title: string; poster_path: string | null; backdrop_path: string | null; overview: string; release_date: string | null; genre_ids: number[]; vote_average: number; popularity: number; original_language: string }) => ({
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
  }));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const tmdbApiKey = Deno.env.get("TMDB_API_KEY");
    if (!tmdbApiKey) {
      return new Response(JSON.stringify({ error: "Search is not configured" }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const query = typeof body.query === "string" ? body.query.trim() : "";
    const mood = typeof body.mood === "string" ? body.mood.trim() : "";
    const moodGenres = mood ? (MOOD_GENRES[mood] ?? []) : [];

    let movies: SearchMovie[];

    if (query) {
      movies = await searchMovies(tmdbApiKey, query, moodGenres);
    } else if (mood && moodGenres.length > 0) {
      movies = await discoverByGenre(tmdbApiKey, moodGenres);
    } else {
      return new Response(JSON.stringify({ error: "A search description or mood is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ movies }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unable to search movies" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
