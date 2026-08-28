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

-- 5. Modify Statements Table
ALTER TABLE public.statements ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_members ENABLE ROW LEVEL SECURITY;
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

-- 7. DYNAMICALLY DROP ALL EXISTING POLICIES TO PREVENT RECURSIVE CONFLICTS
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename IN ('topics', 'topic_members', 'statements', 'profiles')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 8. RLS Policies for Profiles
CREATE POLICY "Allow authenticated users to read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 9. RLS Policies for Topics
CREATE POLICY "Allow authenticated users to read topics"
  ON public.topics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create topics"
  ON public.topics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update topics"
  ON public.topics FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete topics"
  ON public.topics FOR DELETE
  TO authenticated
  USING (true);

-- 10. RLS Policies for Topic Members
CREATE POLICY "Allow authenticated users to read topic memberships"
  ON public.topic_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to add topic members"
  ON public.topic_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update member roles"
  ON public.topic_members FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to remove topic members"
  ON public.topic_members FOR DELETE
  TO authenticated
  USING (true);

-- 11. RLS Policies for Statements
CREATE POLICY "Allow authenticated users to read statements"
  ON public.statements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert statements"
  ON public.statements FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow senders to update their own statements"
  ON public.statements FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid() OR sender_id IS NULL)
  WITH CHECK (true);

CREATE POLICY "Allow senders to delete their own statements"
  ON public.statements FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid() OR sender_id IS NULL);
