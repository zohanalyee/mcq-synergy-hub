
-- 1. Fix external_opportunities: only expose approved rows publicly
DROP POLICY IF EXISTS "Anyone can view approved or pending opportunities" ON public.external_opportunities;
CREATE POLICY "Anyone can view approved opportunities"
  ON public.external_opportunities
  FOR SELECT
  USING (status = 'approved');

-- Keep admin full access (already exists)

-- 2. Fix document_sections: scope to document owner or admin
DROP POLICY IF EXISTS "Authenticated users can view document sections" ON public.document_sections;
CREATE POLICY "Users can view own document sections"
  ON public.document_sections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_sections.document_id
        AND (d.user_id = auth.uid() OR is_admin())
    )
  );

-- 3. Fix realtime.messages: enable RLS and restrict subscriptions
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

-- Allow users to read only messages on channels matching their user ID
CREATE POLICY "Users can read own realtime messages"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() = 'user:' || auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND role = 'admin'
    )
  );

-- Allow inserting messages to own channels
CREATE POLICY "Users can insert own realtime messages"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
