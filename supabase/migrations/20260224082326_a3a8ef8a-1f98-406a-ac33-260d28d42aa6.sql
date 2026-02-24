-- Make course_books bucket private
UPDATE storage.buckets SET public = false WHERE id = 'course_books';

-- Drop overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view course books" ON storage.objects;

-- Add authenticated-only SELECT policy for course_books
CREATE POLICY "Authenticated users can view course books"
ON storage.objects FOR SELECT
USING (bucket_id = 'course_books' AND auth.uid() IS NOT NULL);

-- Fix the lms_approvals overly permissive INSERT policy (WITH CHECK true)
DROP POLICY IF EXISTS "Service role can insert approvals" ON public.lms_approvals;