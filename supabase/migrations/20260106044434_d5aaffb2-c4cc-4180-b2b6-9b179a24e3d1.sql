-- Fix 1: Make content-files bucket private and update storage policies
UPDATE storage.buckets SET public = false WHERE id = 'content-files';

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view uploaded files" ON storage.objects;

-- Create secure policies for content-files bucket
-- Users can view their own uploaded files (files in their user folder)
CREATE POLICY "Users can view their own files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'content-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can view all files
CREATE POLICY "Admins can view all files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'content-files' AND public.is_admin());

-- Users can upload to their own folder
CREATE POLICY "Users can upload to their own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'content-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own files
CREATE POLICY "Users can update their own files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'content-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own files
CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'content-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can manage all files
CREATE POLICY "Admins can upload any file"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'content-files' AND public.is_admin());

CREATE POLICY "Admins can update any file"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'content-files' AND public.is_admin());

CREATE POLICY "Admins can delete any file"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'content-files' AND public.is_admin());

-- Fix 2: Remove overly permissive AI usage logs insert policy
-- Service role bypasses RLS, so no policy is needed for edge function insertions
DROP POLICY IF EXISTS "Service can insert AI usage logs" ON public.ai_usage_logs;