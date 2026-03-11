
-- Fix search_path for new functions
ALTER FUNCTION public.validate_review_rating() SET search_path TO 'public';
ALTER FUNCTION public.set_review_initials() SET search_path TO 'public';
