-- 1. FIX CRITICAL: user_roles privilege escalation
-- Drop existing overly permissive ALL policies (no WITH CHECK)
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;

-- Re-create with explicit WITH CHECK to prevent non-admin inserts
CREATE POLICY "Admins can manage all user roles"
ON public.user_roles FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 2. FIX: pdf_processing_queue public read exposure
DROP POLICY IF EXISTS "Anyone can view pdf queue status" ON public.pdf_processing_queue;

CREATE POLICY "Authenticated users can view own pdf queue"
ON public.pdf_processing_queue FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_admin());

-- 3. FIX: documents public file URLs exposure
DROP POLICY IF EXISTS "Anyone can view documents" ON public.documents;

CREATE POLICY "Authenticated users can view documents"
ON public.documents FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Public can view completed documents"
ON public.documents FOR SELECT
TO anon
USING (status = 'completed');