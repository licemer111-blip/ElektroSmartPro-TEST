-- =====================================================
-- TEAM DATA SHARING
-- =====================================================
-- Allow users to share catalog items and assemblies with team members
-- Visibility: 'personal' (only owner) or 'team' (all team members)
-- Date: 2026-01-29

-- =====================================================
-- 1. ADD COLUMNS TO CATALOG_ITEMS
-- =====================================================
DO $$ 
BEGIN
  -- Add team_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'catalog_items' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE public.catalog_items 
    ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
  END IF;

  -- Add visibility column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'catalog_items' AND column_name = 'visibility'
  ) THEN
    ALTER TABLE public.catalog_items 
    ADD COLUMN visibility TEXT DEFAULT 'personal' 
    CHECK (visibility IN ('personal', 'team'));
  END IF;
END $$;

-- Indexes for catalog_items
CREATE INDEX IF NOT EXISTS idx_catalog_items_team_id ON public.catalog_items(team_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_visibility ON public.catalog_items(visibility);

-- =====================================================
-- 2. ADD COLUMNS TO USER_ASSEMBLIES
-- =====================================================
DO $$ 
BEGIN
  -- Add team_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_assemblies' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE public.user_assemblies 
    ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
  END IF;

  -- Add visibility column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_assemblies' AND column_name = 'visibility'
  ) THEN
    ALTER TABLE public.user_assemblies 
    ADD COLUMN visibility TEXT DEFAULT 'personal' 
    CHECK (visibility IN ('personal', 'team'));
  END IF;
END $$;

-- Indexes for user_assemblies
CREATE INDEX IF NOT EXISTS idx_user_assemblies_team_id ON public.user_assemblies(team_id);
CREATE INDEX IF NOT EXISTS idx_user_assemblies_visibility ON public.user_assemblies(visibility);

-- =====================================================
-- 3. HELPER FUNCTIONS
-- =====================================================

-- Check if user can view team data (is active team member)
CREATE OR REPLACE FUNCTION public.can_view_team_data(p_team_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id 
    AND user_id = p_user_id 
    AND status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM teams
    WHERE id = p_team_id AND owner_id = p_user_id
  );
$$;

-- Check if user can edit team data (admin or kierownik)
CREATE OR REPLACE FUNCTION public.can_edit_team_data(p_team_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id 
    AND user_id = p_user_id 
    AND role IN ('admin', 'kierownik')
    AND status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM teams
    WHERE id = p_team_id AND owner_id = p_user_id
  );
$$;

-- =====================================================
-- 4. RLS POLICIES FOR CATALOG_ITEMS (Team Access)
-- =====================================================

-- Drop existing policies to recreate with team support
DROP POLICY IF EXISTS "Users can view global and own catalog items" ON public.catalog_items;
DROP POLICY IF EXISTS "Users can view own catalog items" ON public.catalog_items;
DROP POLICY IF EXISTS "Authenticated users can view catalog items" ON public.catalog_items;
DROP POLICY IF EXISTS "Users can view catalog items with team access" ON public.catalog_items;

-- SELECT: Users can see global items, own items, and team items they have access to
CREATE POLICY "Users can view catalog items with team access"
ON public.catalog_items FOR SELECT
USING (
  -- Global items (user_id IS NULL)
  user_id IS NULL
  -- Own items
  OR user_id = auth.uid()
  -- Team items where user is a member
  OR (
    visibility = 'team' 
    AND team_id IS NOT NULL 
    AND public.can_view_team_data(team_id, auth.uid())
  )
);

-- DROP existing insert/update/delete policies
DROP POLICY IF EXISTS "Users can insert own catalog items" ON public.catalog_items;
DROP POLICY IF EXISTS "Users can insert catalog items" ON public.catalog_items;
DROP POLICY IF EXISTS "Users can update own catalog items" ON public.catalog_items;
DROP POLICY IF EXISTS "Users can update catalog items" ON public.catalog_items;
DROP POLICY IF EXISTS "Users can delete own catalog items" ON public.catalog_items;
DROP POLICY IF EXISTS "Users can delete catalog items" ON public.catalog_items;
DROP POLICY IF EXISTS "Users can manage catalog items with team access" ON public.catalog_items;

-- INSERT: Users can create items for themselves or their team
CREATE POLICY "Users can insert catalog items"
ON public.catalog_items FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND (
    -- Personal item
    (visibility = 'personal' OR visibility IS NULL)
    -- Team item - must have edit permissions
    OR (visibility = 'team' AND team_id IS NOT NULL AND public.can_edit_team_data(team_id, auth.uid()))
  )
);

-- UPDATE: Users can update own items or team items with proper role
CREATE POLICY "Users can update catalog items"
ON public.catalog_items FOR UPDATE
USING (
  -- Own items
  user_id = auth.uid()
  -- Team items with edit permission
  OR (visibility = 'team' AND team_id IS NOT NULL AND public.can_edit_team_data(team_id, auth.uid()))
)
WITH CHECK (
  user_id = auth.uid()
  OR (visibility = 'team' AND team_id IS NOT NULL AND public.can_edit_team_data(team_id, auth.uid()))
);

-- DELETE: Users can delete own items or team items with proper role
CREATE POLICY "Users can delete catalog items"
ON public.catalog_items FOR DELETE
USING (
  -- Own items
  user_id = auth.uid()
  -- Team items with edit permission
  OR (visibility = 'team' AND team_id IS NOT NULL AND public.can_edit_team_data(team_id, auth.uid()))
);

-- =====================================================
-- 5. RLS POLICIES FOR USER_ASSEMBLIES (Team Access)
-- =====================================================

-- Drop existing policies to recreate with team support
DROP POLICY IF EXISTS "Users can view own assemblies" ON public.user_assemblies;
DROP POLICY IF EXISTS "Users can view assemblies with team access" ON public.user_assemblies;

-- SELECT: Users can see own assemblies and team assemblies
CREATE POLICY "Users can view assemblies with team access"
ON public.user_assemblies FOR SELECT
USING (
  -- Own assemblies
  user_id = auth.uid()
  -- Team assemblies where user is a member
  OR (
    visibility = 'team' 
    AND team_id IS NOT NULL 
    AND public.can_view_team_data(team_id, auth.uid())
  )
);

-- Drop existing insert/update/delete policies
DROP POLICY IF EXISTS "Users can insert own assemblies" ON public.user_assemblies;
DROP POLICY IF EXISTS "Users can insert assemblies" ON public.user_assemblies;
DROP POLICY IF EXISTS "Users can update own assemblies" ON public.user_assemblies;
DROP POLICY IF EXISTS "Users can update assemblies" ON public.user_assemblies;
DROP POLICY IF EXISTS "Users can delete own assemblies" ON public.user_assemblies;
DROP POLICY IF EXISTS "Users can delete assemblies" ON public.user_assemblies;

-- INSERT: Users can create assemblies for themselves or their team
CREATE POLICY "Users can insert assemblies"
ON public.user_assemblies FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND (
    -- Personal assembly
    (visibility = 'personal' OR visibility IS NULL)
    -- Team assembly - must have edit permissions
    OR (visibility = 'team' AND team_id IS NOT NULL AND public.can_edit_team_data(team_id, auth.uid()))
  )
);

-- UPDATE: Users can update own assemblies or team assemblies with proper role
CREATE POLICY "Users can update assemblies"
ON public.user_assemblies FOR UPDATE
USING (
  -- Own assemblies
  user_id = auth.uid()
  -- Team assemblies with edit permission
  OR (visibility = 'team' AND team_id IS NOT NULL AND public.can_edit_team_data(team_id, auth.uid()))
)
WITH CHECK (
  user_id = auth.uid()
  OR (visibility = 'team' AND team_id IS NOT NULL AND public.can_edit_team_data(team_id, auth.uid()))
);

-- DELETE: Users can delete own assemblies or team assemblies with proper role
CREATE POLICY "Users can delete assemblies"
ON public.user_assemblies FOR DELETE
USING (
  -- Own assemblies
  user_id = auth.uid()
  -- Team assemblies with edit permission
  OR (visibility = 'team' AND team_id IS NOT NULL AND public.can_edit_team_data(team_id, auth.uid()))
);

-- =====================================================
-- 6. RLS FOR USER_ASSEMBLY_ITEMS (inherit from parent)
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own assembly items" ON public.user_assembly_items;
DROP POLICY IF EXISTS "Users can view assembly items with team access" ON public.user_assembly_items;

-- SELECT: Based on parent assembly access
CREATE POLICY "Users can view assembly items with team access"
ON public.user_assembly_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_assemblies ua
    WHERE ua.id = user_assembly_items.assembly_id
    AND (
      ua.user_id = auth.uid()
      OR (ua.visibility = 'team' AND ua.team_id IS NOT NULL AND public.can_view_team_data(ua.team_id, auth.uid()))
    )
  )
);

-- Drop existing insert/update/delete policies
DROP POLICY IF EXISTS "Users can insert own assembly items" ON public.user_assembly_items;
DROP POLICY IF EXISTS "Users can insert assembly items" ON public.user_assembly_items;
DROP POLICY IF EXISTS "Users can update own assembly items" ON public.user_assembly_items;
DROP POLICY IF EXISTS "Users can update assembly items" ON public.user_assembly_items;
DROP POLICY IF EXISTS "Users can delete own assembly items" ON public.user_assembly_items;
DROP POLICY IF EXISTS "Users can delete assembly items" ON public.user_assembly_items;

-- INSERT
CREATE POLICY "Users can insert assembly items"
ON public.user_assembly_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_assemblies ua
    WHERE ua.id = user_assembly_items.assembly_id
    AND (
      ua.user_id = auth.uid()
      OR (ua.visibility = 'team' AND ua.team_id IS NOT NULL AND public.can_edit_team_data(ua.team_id, auth.uid()))
    )
  )
);

-- UPDATE
CREATE POLICY "Users can update assembly items"
ON public.user_assembly_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_assemblies ua
    WHERE ua.id = user_assembly_items.assembly_id
    AND (
      ua.user_id = auth.uid()
      OR (ua.visibility = 'team' AND ua.team_id IS NOT NULL AND public.can_edit_team_data(ua.team_id, auth.uid()))
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_assemblies ua
    WHERE ua.id = user_assembly_items.assembly_id
    AND (
      ua.user_id = auth.uid()
      OR (ua.visibility = 'team' AND ua.team_id IS NOT NULL AND public.can_edit_team_data(ua.team_id, auth.uid()))
    )
  )
);

-- DELETE
CREATE POLICY "Users can delete assembly items"
ON public.user_assembly_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_assemblies ua
    WHERE ua.id = user_assembly_items.assembly_id
    AND (
      ua.user_id = auth.uid()
      OR (ua.visibility = 'team' AND ua.team_id IS NOT NULL AND public.can_edit_team_data(ua.team_id, auth.uid()))
    )
  )
);

-- =====================================================
-- 7. COMMENTS
-- =====================================================
COMMENT ON COLUMN public.catalog_items.team_id IS 'Team that owns this item (for team-shared items)';
COMMENT ON COLUMN public.catalog_items.visibility IS 'personal = only owner sees, team = all team members see';
COMMENT ON COLUMN public.user_assemblies.team_id IS 'Team that owns this assembly (for team-shared assemblies)';
COMMENT ON COLUMN public.user_assemblies.visibility IS 'personal = only owner sees, team = all team members see';

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Team data sharing migration completed successfully' as status;
