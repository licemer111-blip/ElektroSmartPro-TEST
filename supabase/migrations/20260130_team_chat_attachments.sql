-- =====================================================
-- Team Chat Attachments & Message Editing
-- Add support for file attachments and message editing
-- =====================================================

-- Add attachment columns to team_messages
DO $$
BEGIN
  -- Add updated_at column for tracking edits
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_messages' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.team_messages ADD COLUMN updated_at TIMESTAMPTZ;
  END IF;

  -- Add attachment_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_messages' AND column_name = 'attachment_url'
  ) THEN
    ALTER TABLE public.team_messages ADD COLUMN attachment_url TEXT;
  END IF;

  -- Add attachment_filename column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_messages' AND column_name = 'attachment_filename'
  ) THEN
    ALTER TABLE public.team_messages ADD COLUMN attachment_filename TEXT;
  END IF;

  -- Add attachment_type column (MIME type)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_messages' AND column_name = 'attachment_type'
  ) THEN
    ALTER TABLE public.team_messages ADD COLUMN attachment_type TEXT;
  END IF;

  -- Add attachment_size column (in bytes)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_messages' AND column_name = 'attachment_size'
  ) THEN
    ALTER TABLE public.team_messages ADD COLUMN attachment_size BIGINT;
  END IF;
END $$;

-- Create storage bucket for team attachments if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team-attachments',
  'team-attachments',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for team-attachments bucket
DROP POLICY IF EXISTS "Team members can upload attachments" ON storage.objects;
CREATE POLICY "Team members can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'team-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.teams t
    WHERE t.owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = t.id 
      AND tm.user_id = auth.uid() 
      AND tm.status = 'active'
    )
  )
);

DROP POLICY IF EXISTS "Team members can view attachments" ON storage.objects;
CREATE POLICY "Team members can view attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'team-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.teams t
    WHERE t.owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = t.id 
      AND tm.user_id = auth.uid() 
      AND tm.status = 'active'
    )
  )
);

DROP POLICY IF EXISTS "Users can delete own attachments" ON storage.objects;
CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'team-attachments'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Add comments
COMMENT ON COLUMN public.team_messages.updated_at IS 'Timestamp when message was last edited';
COMMENT ON COLUMN public.team_messages.attachment_url IS 'URL of attached file';
COMMENT ON COLUMN public.team_messages.attachment_filename IS 'Original filename of attachment';
COMMENT ON COLUMN public.team_messages.attachment_type IS 'MIME type of attachment';
COMMENT ON COLUMN public.team_messages.attachment_size IS 'Size of attachment in bytes';
