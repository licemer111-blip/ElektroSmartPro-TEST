-- ============================================================================
-- 📁 Utwórz bucket "project-documents" (jeśli błąd "Bucket not found")
-- ============================================================================
-- Uruchom w Supabase Dashboard → SQL Editor → New query → wklej i Run.
-- Albo: Storage → New bucket → id: project-documents, private, 25 MB.
-- Obsługiwane typy: PDF, JPG, PNG, WEBP, Excel (XLSX/XLS), CSV, TXT
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-documents',
  'project-documents',
  false,
  26214400,
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
