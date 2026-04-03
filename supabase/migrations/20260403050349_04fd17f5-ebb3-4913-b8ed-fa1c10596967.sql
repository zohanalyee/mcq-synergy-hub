
DROP POLICY IF EXISTS "Anyone can view approved opportunities" ON public.external_opportunities;

CREATE POLICY "Anyone can view approved or pending opportunities"
ON public.external_opportunities
FOR SELECT
TO public
USING (status IN ('approved', 'pending'));
