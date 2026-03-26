-- ============================================================================
-- 📁 Bucket dla dokumentacji projektów (Materiały → załączniki)
-- ============================================================================
-- Ścieżka: {project_id}/{unique_id}_{filename}
-- Dostęp: użytkownicy z dostępem do projektu (owner / członek zespołu / project_member)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-documents',
  'project-documents',
  false,
  26214400, -- 25 MB
  ARRAY[
    'application/pdf',
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', -- xlsx
    'application/vnd.ms-excel', -- xls
    'text/csv',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  allowed_mime_types = ARRAY[
    'application/pdf',
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'text/plain'
  ];

-- Helper: czy użytkownik ma dostęp do projektu (view lub edit)
CREATE OR REPLACE FUNCTION public.user_has_project_storage_access(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_project_id
    AND (
      p.user_id = auth.uid()
      OR p.team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND status = 'active')
      OR EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p.id AND user_id = auth.uid())
    )
  );
$$;

-- SELECT: użytkownik z dostępem do projektu może przeglądać pliki
DROP POLICY IF EXISTS "Project docs: view by project access" ON storage.objects;
CREATE POLICY "Project docs: view by project access"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-documents'
    AND public.user_has_project_storage_access(((storage.foldername(name))[1])::uuid)
  );

-- INSERT: użytkownik z dostępem do projektu może dodawać pliki
DROP POLICY IF EXISTS "Project docs: upload by project access" ON storage.objects;
CREATE POLICY "Project docs: upload by project access"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-documents'
    AND public.user_has_project_storage_access(((storage.foldername(name))[1])::uuid)
  );

-- DELETE: użytkownik z dostępem do projektu może usuwać pliki
DROP POLICY IF EXISTS "Project docs: delete by project access" ON storage.objects;
CREATE POLICY "Project docs: delete by project access"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'project-documents'
    AND public.user_has_project_storage_access(((storage.foldername(name))[1])::uuid)
  );
