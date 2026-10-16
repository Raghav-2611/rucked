-- ==============================================================================
-- Migration: Public Topic Sharing & Tag/Handle Discovery
-- Allows unauthenticated (anon) users to view shared topics & statements,
-- and allows public searching of user profiles and their public topics.
-- ==============================================================================

-- 1. Add is_public column to topics table (defaults to true)
ALTER TABLE public.topics 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Update any existing topics to be public by default
UPDATE public.topics 
SET is_public = true 
WHERE is_public IS NULL;

-- 2. Indexes for fast profile handle search and public topic lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower 
ON public.profiles (lower(username));

CREATE INDEX IF NOT EXISTS idx_topics_is_public_created_by 
ON public.topics (created_by, is_public);

-- 3. RLS: Allow public (anon + authenticated) to SELECT profiles
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read access on profiles" ON public.profiles;

CREATE POLICY "Allow public read access on profiles"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- 4. RLS: Allow public (anon + authenticated) to SELECT topics
DROP POLICY IF EXISTS "Allow authenticated users to read topics" ON public.topics;
DROP POLICY IF EXISTS "Allow public read access on topics" ON public.topics;

CREATE POLICY "Allow public read access on topics"
  ON public.topics FOR SELECT
  TO anon, authenticated
  USING (true);

-- 5. RLS: Allow public (anon + authenticated) to SELECT statements
DROP POLICY IF EXISTS "Allow authenticated users to read statements" ON public.statements;
DROP POLICY IF EXISTS "Allow public read access on statements" ON public.statements;

CREATE POLICY "Allow public read access on statements"
  ON public.statements FOR SELECT
  TO anon, authenticated
  USING (true);

-- 6. RLS: Allow public (anon + authenticated) to SELECT topic_members
DROP POLICY IF EXISTS "Allow authenticated users to read topic memberships" ON public.topic_members;
DROP POLICY IF EXISTS "Allow public read access on topic memberships" ON public.topic_members;

CREATE POLICY "Allow public read access on topic memberships"
  ON public.topic_members FOR SELECT
  TO anon, authenticated
  USING (true);

-- NOTE: All INSERT, UPDATE, and DELETE policies remain strictly restricted to
-- authenticated users and appropriate owners/admins. Unauthenticated visitors
-- are guaranteed read-only permissions at the database level.
