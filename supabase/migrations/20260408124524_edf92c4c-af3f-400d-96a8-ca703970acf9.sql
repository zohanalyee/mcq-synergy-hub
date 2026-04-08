
-- 1. Fix documents: scope SELECT to owner/admin only
DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.documents;
CREATE POLICY "Users can view own documents"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- 2. Fix realtime.messages INSERT: scope to own channel
DROP POLICY IF EXISTS "Users can insert own realtime messages" ON realtime.messages;
CREATE POLICY "Users can insert own realtime messages"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    realtime.topic() = 'user:' || auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Fix contact_submissions: enforce user_id ownership
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
CREATE POLICY "Anyone can submit contact form"
  ON public.contact_submissions
  FOR INSERT
  TO public
  WITH CHECK (
    name IS NOT NULL AND length(name) > 0 AND length(name) <= 200
    AND email IS NOT NULL AND length(email) > 0 AND length(email) <= 255
    AND message IS NOT NULL AND length(message) > 0 AND length(message) <= 5000
    AND (user_id IS NULL OR user_id = auth.uid())
  );
