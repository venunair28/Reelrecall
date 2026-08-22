/*
# Create ReelRecall core schema

1. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `display_name` (text, nullable, user-facing name)
  - `created_at` (timestamptz, creation timestamp)
- `watchlist`
  - `id` (uuid, primary key)
  - `user_id` (uuid, owner reference to auth.users)
  - `tmdb_id` (integer, movie identifier)
  - `title` (text, movie title)
  - `poster_path` (text, nullable TMDB poster path)
  - `year` (integer, nullable release year)
  - `genre` (text, nullable display genre)
  - `tmdb_rating` (numeric, nullable TMDB rating)
  - `personal_rating` (integer, nullable personal rating from 1 to 5)
  - `added_at` (timestamptz, time added)

2. Security
- Enable row-level security on both tables.
- Restrict every profile operation to the matching authenticated user.
- Restrict every watchlist operation to rows owned by the matching authenticated user.
- Validate personal ratings at the database boundary.

3. Important Notes
- Owner IDs default to the authenticated user so client inserts cannot omit ownership safely.
- Watchlist movie IDs are unique per user to prevent duplicate saved movies.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id integer NOT NULL,
  title text NOT NULL,
  poster_path text,
  year integer,
  genre text,
  tmdb_rating numeric(3,1),
  personal_rating integer CHECK (personal_rating IS NULL OR personal_rating BETWEEN 1 AND 5),
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tmdb_id)
);

CREATE INDEX IF NOT EXISTS watchlist_user_added_at_idx ON public.watchlist (user_id, added_at DESC);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "watchlist_select_own" ON public.watchlist;
CREATE POLICY "watchlist_select_own" ON public.watchlist FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "watchlist_insert_own" ON public.watchlist;
CREATE POLICY "watchlist_insert_own" ON public.watchlist FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "watchlist_update_own" ON public.watchlist;
CREATE POLICY "watchlist_update_own" ON public.watchlist FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "watchlist_delete_own" ON public.watchlist;
CREATE POLICY "watchlist_delete_own" ON public.watchlist FOR DELETE TO authenticated USING (auth.uid() = user_id);