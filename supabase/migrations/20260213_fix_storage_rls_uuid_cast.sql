-- ============================================================================
-- 🔧 Fix: storage RLS policy crashes on non-UUID folder names (22P02)
-- ============================================================================
-- Root cause: signatures/ folder exists in project-documents bucket.
-- The RLS policy casts (storage.foldername(name))[1] to UUID, which fails
-- for non-UUID folder names like "signatures".
-- Fix: use a safe UUID cast helper that returns NULL instead of crashing.
-- ============================================================================

-- Safe UUID cast: returns NULL if text is not a valid UUID
CREATE OR REPLACE FUNCTION public.safe_cast_uuid(p_text text)
RETURNS UUID
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  RETURN p_text::uuid;
EXCEPTION WHEN invalid_text_representation THEN
  RETURN NULL;
END;
$$;

-- Updated storage access helper: safely handles non-UUID folder names
CREATE OR REPLACE FUNCTION public.user_has_project_storage_access(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE WHEN p_project_id IS NULL THEN false
  ELSE EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_project_id
    AND (
      p.user_id = auth.uid()
      OR p.team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND status = 'active')
      OR EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p.id AND user_id = auth.uid())
    )
  )
  END;
$$;

-- Recreate storage policies with safe UUID cast
DROP POLICY IF EXISTS "Project docs: view by project access" ON storage.objects;
CREATE POLICY "Project docs: view by project access"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-documents'
    AND public.user_has_project_storage_access(
      public.safe_cast_uuid((storage.foldername(name))[1])
    )
  );

DROP POLICY IF EXISTS "Project docs: upload by project access" ON storage.objects;
CREATE POLICY "Project docs: upload by project access"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-documents'
    AND public.user_has_project_storage_access(
      public.safe_cast_uuid((storage.foldername(name))[1])
    )
  );

DROP POLICY IF EXISTS "Project docs: delete by project access" ON storage.objects;
CREATE POLICY "Project docs: delete by project access"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'project-documents'
    AND public.user_has_project_storage_access(
      public.safe_cast_uuid((storage.foldername(name))[1])
    )
  );
