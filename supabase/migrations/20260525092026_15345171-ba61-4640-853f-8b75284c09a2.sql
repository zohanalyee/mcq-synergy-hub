
-- content_items: replace permissive insert policies with status-restricted ones
DROP POLICY IF EXISTS "Authenticated users can insert content" ON public.content_items;
DROP POLICY IF EXISTS "Authenticated users can insert their own content items" ON public.content_items;

CREATE POLICY "Users can insert own pending content"
ON public.content_items
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (created_by IS NULL OR created_by = auth.uid())
  AND status = 'pending'
);

-- content_items: restrict updates so non-admins cannot change status
DROP POLICY IF EXISTS "Users can update their own content" ON public.content_items;

CREATE POLICY "Users can update their own content"
ON public.content_items
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by OR is_admin())
WITH CHECK (
  is_admin()
  OR (
    auth.uid() = created_by
    AND status = (SELECT ci.status FROM public.content_items ci WHERE ci.id = content_items.id)
  )
);

-- user_notifications: restrict insert policy to authenticated role
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.user_notifications;

CREATE POLICY "Users can insert own notifications"
ON public.user_notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
