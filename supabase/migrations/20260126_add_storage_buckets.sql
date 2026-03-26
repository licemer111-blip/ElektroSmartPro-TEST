-- Migration: Add storage buckets for PWA features
-- Created: 2026-01-26
-- Description: Create storage buckets for project photos

-- Create project-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-photos',
  'project-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for project-photos bucket
DROP POLICY IF EXISTS "Users can view their own project photos" ON storage.objects;
CREATE POLICY "Users can view their own project photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'project-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can upload their own project photos" ON storage.objects;
CREATE POLICY "Users can upload their own project photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'project-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete their own project photos" ON storage.objects;
CREATE POLICY "Users can delete their own project photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'project-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

COMMENT ON SCHEMA storage IS 'Storage schema for file uploads';
