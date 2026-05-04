-- Tighten course_books storage INSERT to enforce folder ownership (matching avatars/content-files pattern)
DROP POLICY IF EXISTS "Authenticated users can upload course books" ON storage.objects;

CREATE POLICY "Users can upload course books to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course_books'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Tighten content_items INSERT: bind created_by to the authenticated user so callers
-- cannot impersonate another user as the submitter. Existing approval workflow stays intact.
DROP POLICY IF EXISTS "Authenticated users can insert content items" ON public.content_items;
DROP POLICY IF EXISTS "Authenticated users can create content items" ON public.content_items;
DROP POLICY IF EXISTS "Users can insert content items" ON public.content_items;

CREATE POLICY "Authenticated users can insert their own content items"
ON public.content_items
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (created_by IS NULL OR created_by = auth.uid())
);