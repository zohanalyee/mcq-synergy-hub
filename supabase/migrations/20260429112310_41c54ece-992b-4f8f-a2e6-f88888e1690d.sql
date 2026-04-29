-- 1. Remove anon SELECT exposure on documents
DROP POLICY IF EXISTS "Public can view completed documents" ON public.documents;

-- 2. Add missing INSERT/UPDATE/DELETE policies on user_documents (owner-scoped)
CREATE POLICY "Users can insert their own user_documents"
ON public.user_documents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own user_documents"
ON public.user_documents
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR is_admin())
WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can delete their own user_documents"
ON public.user_documents
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR is_admin());