
-- Fix 1: Remove overly broad content-files INSERT policy
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;

-- Fix 2: Restrict course_books SELECT to user's own folder
DROP POLICY IF EXISTS "Authenticated users can view course books" ON storage.objects;

CREATE POLICY "Users can view their own course books"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'course_books'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin(auth.uid())
  )
);
