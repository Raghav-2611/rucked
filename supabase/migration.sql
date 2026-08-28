-- =======================================================
-- Phase 2 Database Migration (Authentication & Groups)
-- =======================================================

-- 1. Create Profiles Table (linked to Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create Profile Policies
CREATE POLICY "Allow authenticated users to read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. Trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_username TEXT;
  new_username TEXT;
  num INT := 0;
BEGIN
  -- Extract email prefix for username
  base_username := COALESCE(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );
  
  -- Clean up username (keep only alphanumeric and underscores)
  base_username := regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g');
  
  -- Handle empty username
  IF base_username = '' THEN
    base_username := 'user';
  END IF;
  
  new_username := base_username;
  
  -- Ensure unique username
  LOOP
    BEGIN
      INSERT INTO public.profiles (id, username, display_name, avatar_url)
      VALUES (
        new.id,
        new_username,
        COALESCE(new.raw_user_meta_data->>'display_name', new_username),
        new.raw_user_meta_data->>'avatar_url'
      );
      EXIT; -- Insert succeeded, exit loop
    EXCEPTION WHEN unique_violation THEN
      num := num + 1;
      new_username := base_username || num::text;
    END;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Modify Topics Table
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT false;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 4. Create Topic Members Join Table
CREATE TABLE IF NOT EXISTS public.topic_members (
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'edit' CHECK (role IN ('admin', 'edit', 'view')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (topic_id, user_id)
);

-- Add role column if the table already exists (idempotent upgrade)
ALTER TABLE public.topic_members ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'edit' CHECK (role IN ('admin', 'edit', 'view'));

-- Enable RLS on topic_members
ALTER TABLE public.topic_members ENABLE ROW LEVEL SECURITY;

-- 5. Modify Statements Table
ALTER TABLE public.statements ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Enable RLS on topics and statements (overwrite/re-enable)
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statements ENABLE ROW LEVEL SECURITY;
-- 6. Helper Function (SECURITY DEFINER to prevent RLS recursion)
CREATE OR REPLACE FUNCTION public.is_topic_member(_topic_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.topic_members 
    WHERE topic_id = _topic_id AND user_id = _user_id
  );
$$;

-- Drop old policies if existing
DROP POLICY IF EXISTS "Allow public full access on topics" ON public.topics;
DROP POLICY IF EXISTS "Allow public full access on statements" ON public.statements;
DROP POLICY IF EXISTS "Allow members to read topics" ON public.topics;
DROP POLICY IF EXISTS "Allow authenticated users to create topics" ON public.topics;
DROP POLICY IF EXISTS "Allow members to update topics" ON public.topics;
DROP POLICY IF EXISTS "Allow members to delete topics" ON public.topics;
DROP POLICY IF EXISTS "Allow members to read topic memberships" ON public.topic_members;
DROP POLICY IF EXISTS "Allow members to add other members" ON public.topic_members;
DROP POLICY IF EXISTS "Allow members to update member roles" ON public.topic_members;
DROP POLICY IF EXISTS "Allow members to leave or remove members" ON public.topic_members;
DROP POLICY IF EXISTS "Allow members to read statements" ON public.statements;
DROP POLICY IF EXISTS "Allow members to insert statements" ON public.statements;
DROP POLICY IF EXISTS "Allow senders to update their own statements" ON public.statements;
DROP POLICY IF EXISTS "Allow senders to delete their own statements" ON public.statements;

-- 7. RLS Policies for Topics
CREATE POLICY "Allow members to read topics"
  ON public.topics FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR public.is_topic_member(id, auth.uid())
  );

CREATE POLICY "Allow authenticated users to create topics"
  ON public.topics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow members to update topics"
  ON public.topics FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR public.is_topic_member(id, auth.uid())
  );

CREATE POLICY "Allow members to delete topics"
  ON public.topics FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR public.is_topic_member(id, auth.uid())
  );

-- 8. RLS Policies for Topic Members
CREATE POLICY "Allow members to read topic memberships"
  ON public.topic_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    public.is_topic_member(topic_id, auth.uid()) OR
    EXISTS (SELECT 1 FROM public.topics WHERE id = topic_id AND created_by = auth.uid())
  );

CREATE POLICY "Allow members to add other members"
  ON public.topic_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    public.is_topic_member(topic_id, auth.uid()) OR
    EXISTS (SELECT 1 FROM public.topics WHERE id = topic_id AND created_by = auth.uid())
  );

CREATE POLICY "Allow members to update member roles"
  ON public.topic_members FOR UPDATE
  TO authenticated
  USING (
    public.is_topic_member(topic_id, auth.uid()) OR
    EXISTS (SELECT 1 FROM public.topics WHERE id = topic_id AND created_by = auth.uid())
  );

CREATE POLICY "Allow members to leave or remove members"
  ON public.topic_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    public.is_topic_member(topic_id, auth.uid()) OR
    EXISTS (SELECT 1 FROM public.topics WHERE id = topic_id AND created_by = auth.uid())
  );

-- 9. RLS Policies for Statements
CREATE POLICY "Allow members to read statements"
  ON public.statements FOR SELECT
  TO authenticated
  USING (
    public.is_topic_member(topic_id, auth.uid()) OR
    EXISTS (SELECT 1 FROM public.topics WHERE id = topic_id AND created_by = auth.uid())
  );

CREATE POLICY "Allow members to insert statements"
  ON public.statements FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND (
      public.is_topic_member(topic_id, auth.uid()) OR
      EXISTS (SELECT 1 FROM public.topics WHERE id = topic_id AND created_by = auth.uid())
    )
  );

CREATE POLICY "Allow senders to update their own statements"
  ON public.statements FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Allow senders to delete their own statements"
  ON public.statements FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());
