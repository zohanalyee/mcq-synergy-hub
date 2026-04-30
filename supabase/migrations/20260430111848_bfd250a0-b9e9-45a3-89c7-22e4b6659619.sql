
-- Fix avatars bucket: enforce path-based ownership on INSERT
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- Add UPDATE and DELETE policies for course_books owners
CREATE POLICY "Users can update their own course books"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course_books'
  AND (storage.foldername(name))[1] = (auth.uid())::text
)
WITH CHECK (
  bucket_id = 'course_books'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

CREATE POLICY "Users can delete their own course books"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'course_books'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);
