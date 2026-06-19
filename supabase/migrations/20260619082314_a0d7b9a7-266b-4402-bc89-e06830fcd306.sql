-- 1. Add moderation column
ALTER TABLE public.user_feedback ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- 2. Backfill existing rows so current /reviews stays visible
UPDATE public.user_feedback SET is_public = true;

-- 3. Drop the over-permissive public SELECT policy
DROP POLICY IF EXISTS "Public can view feedback reviews" ON public.user_feedback;

-- 4. Public RPC: approved reviews, safe columns only
CREATE OR REPLACE FUNCTION public.get_public_feedback_reviews(filter_rating integer DEFAULT NULL, sort_by text DEFAULT 'recent')
RETURNS TABLE(
  id uuid,
  user_name text,
  user_avatar_url text,
  stars integer,
  message text,
  category text,
  created_at timestamp with time zone,
  is_guest boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT uf.id, uf.user_name, uf.user_avatar_url, uf.stars, uf.message,
         uf.category, uf.created_at, uf.is_guest
  FROM public.user_feedback uf
  WHERE uf.is_public = true
    AND (filter_rating IS NULL OR uf.stars = filter_rating)
  ORDER BY
    CASE WHEN sort_by = 'rating' THEN uf.stars END DESC NULLS LAST,
    uf.created_at DESC;
$$;

-- 5. Public RPC: aggregate stats over approved reviews
CREATE OR REPLACE FUNCTION public.get_public_feedback_stats()
RETURNS TABLE(
  avg_rating numeric,
  total_reviews bigint,
  five_star bigint,
  four_star bigint,
  three_star bigint,
  two_star bigint,
  one_star bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ROUND(AVG(uf.stars)::numeric, 1) AS avg_rating,
    COUNT(*)::bigint AS total_reviews,
    COUNT(*) FILTER (WHERE uf.stars = 5)::bigint AS five_star,
    COUNT(*) FILTER (WHERE uf.stars = 4)::bigint AS four_star,
    COUNT(*) FILTER (WHERE uf.stars = 3)::bigint AS three_star,
    COUNT(*) FILTER (WHERE uf.stars = 2)::bigint AS two_star,
    COUNT(*) FILTER (WHERE uf.stars = 1)::bigint AS one_star
  FROM public.user_feedback uf
  WHERE uf.is_public = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_feedback_reviews(integer, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_feedback_stats() TO anon, authenticated;