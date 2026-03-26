-- Migration: Multi-tenant Knowledge Base
-- Adds user_id to knowledge_base_meta for per-user file isolation
-- Global files (user_id IS NULL) = readable by everyone
-- User files (user_id IS NOT NULL) = readable only by owner

-- 1. Add user_id column (nullable — existing global rows stay NULL)
ALTER TABLE knowledge_base_meta
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Add index for fast per-user lookups
CREATE INDEX IF NOT EXISTS idx_kb_meta_user_id ON knowledge_base_meta(user_id);

-- 3. Enable RLS (if not already enabled)
ALTER TABLE knowledge_base_meta ENABLE ROW LEVEL SECURITY;

-- 4. Drop old policies if they exist
DROP POLICY IF EXISTS "Admin full access" ON knowledge_base_meta;
DROP POLICY IF EXISTS "Global KB readable by all" ON knowledge_base_meta;
DROP POLICY IF EXISTS "User owns their KB files" ON knowledge_base_meta;
DROP POLICY IF EXISTS "Service role bypass" ON knowledge_base_meta;

-- 5. Service role bypass (for server-side admin operations)
CREATE POLICY "Service role bypass"
  ON knowledge_base_meta
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 6. Global files (user_id IS NULL) are readable by all authenticated users
CREATE POLICY "Global KB readable by all"
  ON knowledge_base_meta
  FOR SELECT
  TO authenticated
  USING (user_id IS NULL);

-- 7. Users can fully manage their own files
CREATE POLICY "User owns their KB files"
  ON knowledge_base_meta
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 8. Add cache_name_user column for per-user cache tracking
ALTER TABLE knowledge_base_meta
  ADD COLUMN IF NOT EXISTS cache_name_user text NULL;

COMMENT ON COLUMN knowledge_base_meta.user_id IS 'NULL = global admin file; UUID = user-owned private file';
COMMENT ON COLUMN knowledge_base_meta.cache_name_user IS 'Gemini cache name for user-specific context (separate from global cache)';
