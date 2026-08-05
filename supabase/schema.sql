-- ==========================================
-- rucked Database Schema (Supabase / Postgres)
-- ==========================================

-- 1. Topics Table
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Statements Table
CREATE TABLE IF NOT EXISTS statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_statements_topic_id_created_at 
ON statements(topic_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_topics_created_at 
ON topics(created_at DESC);

-- 4. Enable Row Level Security (RLS) & Public Policies
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public full access on topics" 
ON topics FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public full access on statements" 
ON statements FOR ALL USING (true) WITH CHECK (true);
