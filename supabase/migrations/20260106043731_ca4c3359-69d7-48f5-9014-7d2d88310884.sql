-- Remove the dangerous Debug Policy that bypasses all RLS security
DROP POLICY IF EXISTS "Debug Policy" ON public.content_items;