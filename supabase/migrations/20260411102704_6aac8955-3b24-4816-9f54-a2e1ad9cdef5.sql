
-- Fix 1: Restrict reviews INSERT to authenticated users only (remove NULL user_id allowance)
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
CREATE POLICY "Users can insert their own reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fix 2: Add explicit SELECT policy on att_staff for clarity
CREATE POLICY "Users can view own staff records"
ON public.att_staff
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
