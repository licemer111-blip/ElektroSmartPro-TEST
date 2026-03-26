-- Create private Supabase Storage bucket for AI Knowledge Base JSON files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ai-knowledge-base',
  'ai-knowledge-base',
  false,
  10485760, -- 10MB per file
  ARRAY['application/json', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS: Only admin users can manage files in this bucket
CREATE POLICY "Admins can read ai-knowledge-base"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'ai-knowledge-base'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can upload ai-knowledge-base"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ai-knowledge-base'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update ai-knowledge-base"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ai-knowledge-base'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete ai-knowledge-base"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ai-knowledge-base'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
