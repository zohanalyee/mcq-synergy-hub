-- Remove the public SELECT policy that exposed all columns (including user_id) to anyone
DROP POLICY IF EXISTS "Anyone can view public reviews" ON public.reviews;

-- Allow authenticated users to read their own reviews (needed for "already reviewed" check)
CREATE POLICY "Users can view their own reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Safe public accessor that never exposes user_id
CREATE OR REPLACE FUNCTION public.get_public_reviews(p_min_rating integer DEFAULT 1, p_limit integer DEFAULT 6)
RETURNS TABLE(
  id uuid,
  rating integer,
  comment text,
  reviewer_name text,
  reviewer_role text,
  reviewer_initials text,
  show_name boolean,
  is_anonymous boolean,
  is_verified boolean,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    r.id,
    r.rating,
    r.comment::text,
    r.reviewer_name::text,
    r.reviewer_role::text,
    r.reviewer_initials::text,
    r.show_name,
    r.is_anonymous,
    r.is_verified,
    r.created_at
  FROM public.reviews r
  WHERE r.display_publicly = true
    AND r.rating >= GREATEST(1, COALESCE(p_min_rating, 1))
  ORDER BY r.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 6), 100));
$$;

GRANT EXECUTE ON FUNCTION public.get_public_reviews(integer, integer) TO anon, authenticated, service_role;