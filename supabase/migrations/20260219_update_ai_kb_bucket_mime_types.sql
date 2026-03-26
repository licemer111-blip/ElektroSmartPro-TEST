-- Update ai-knowledge-base bucket to allow JSON, CSV, XLSX, XLS, PDF, TXT
-- Run this in Supabase Dashboard → SQL Editor
UPDATE storage.buckets
SET
  file_size_limit = 20971520, -- 20MB
  allowed_mime_types = ARRAY[
    'application/json',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/pdf',
    'text/plain'
  ]
WHERE id = 'ai-knowledge-base';
