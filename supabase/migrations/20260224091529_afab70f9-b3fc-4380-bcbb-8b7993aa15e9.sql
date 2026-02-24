
-- 1. Restrict document_sections to authenticated users only
DROP POLICY IF EXISTS "Anyone can view document sections" ON public.document_sections;
CREATE POLICY "Authenticated users can view document sections"
ON public.document_sections FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 2. Make content-files bucket private
UPDATE storage.buckets SET public = false WHERE id = 'content-files';

-- 3. Drop overly permissive storage policy for content-files
DROP POLICY IF EXISTS "Anyone can view uploaded files" ON storage.objects;

-- 4. Add authenticated-only view policy for content-files
CREATE POLICY "Authenticated users can view content files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'content-files'
  AND auth.uid() IS NOT NULL
);
