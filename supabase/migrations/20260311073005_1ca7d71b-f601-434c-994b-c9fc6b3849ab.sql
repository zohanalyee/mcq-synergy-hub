-- Allow anyone to insert ratings (anonymous or authenticated)
CREATE POLICY "Anyone can insert ratings"
ON public.user_ratings
FOR INSERT
TO public
WITH CHECK (true);

-- Allow public to read ratings
CREATE POLICY "Anyone can read ratings"
ON public.user_ratings
FOR SELECT
TO public
USING (true);