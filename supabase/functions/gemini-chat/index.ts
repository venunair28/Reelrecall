import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TMDB_BASE = "https://api.themoviedb.org/3";
const GEMINI_MODEL = "gemini-2.0-flash";

type MovieContext = {
  title: string;
  year: string | null;
  overview: string;
  genres: string[];
  cast: string[];
  rating: number | null;
};

async function fetchMovieContext(apiKey: string, movieId: number): Promise<MovieContext> {
  const response = await fetch(`${TMDB_BASE}/movie/${movieId}?api_key=${apiKey}&append_to_response=credits`);
  if (!response.ok) throw new Error("Movie information could not be loaded");
  const movie = await response.json();
  const cast = (movie.credits?.cast ?? [])
    .slice(0, 8)
    .map((person: { name?: string; character?: string }) => person.character ? `${person.name} as ${person.character}` : person.name)
    .filter(Boolean);

  return {
    title: movie.title,
    year: movie.release_date ? movie.release_date.slice(0, 4) : null,
    overview: movie.overview || "No synopsis is available.",
    genres: (movie.genres ?? []).map((genre: { name: string }) => genre.name),
    cast,
    rating: typeof movie.vote_average === "number" ? movie.vote_average : null,
  };
}

async function askGemini(apiKey: string, movie: MovieContext, question: string): Promise<string> {
  const prompt = `You are ReelRecall's movie guide. Answer the user's question about this movie using only the supplied movie context. Be helpful, concise, and clear. If the question asks about an ending or plot detail that is not in the synopsis, say that the available context does not confirm it rather than inventing details. For awards, say that awards data is not included in the current context and avoid guessing.\n\nMovie: ${movie.title}${movie.year ? ` (${movie.year})` : ""}\nGenres: ${movie.genres.join(", ") || "Unknown"}\nTMDB rating: ${movie.rating ?? "Unknown"}\nSynopsis: ${movie.overview}\nMain cast: ${movie.cast.join("; ") || "Unknown"}\n\nUser question: ${question}`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 500 },
    }),
  });
  if (!response.ok) throw new Error("The movie guide is unavailable right now");
  const data = await response.json();
  const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof answer !== "string" || !answer.trim()) throw new Error("The movie guide returned no answer");
  return answer.trim();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const tmdbApiKey = Deno.env.get("TMDB_API_KEY");
    if (!geminiApiKey || !tmdbApiKey) {
      return new Response(JSON.stringify({ error: "Movie guide is not configured" }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const body = await req.json();
    const movieId = Number(body.movieId);
    const question = typeof body.question === "string" ? body.question.trim() : "";
    if (!Number.isInteger(movieId) || movieId <= 0 || !question || question.length > 500) {
      return new Response(JSON.stringify({ error: "A valid movie and question are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const movie = await fetchMovieContext(tmdbApiKey, movieId);
    const answer = await askGemini(geminiApiKey, movie, question);
    return new Response(JSON.stringify({ answer, movie: { title: movie.title, year: movie.year } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unable to answer that question" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
