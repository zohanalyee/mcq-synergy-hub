
-- Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  display_publicly BOOLEAN DEFAULT false,
  show_name BOOLEAN DEFAULT true,
  is_anonymous BOOLEAN DEFAULT false,
  reviewer_name TEXT,
  reviewer_role TEXT,
  reviewer_initials TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reviews_publicly ON public.reviews(display_publicly) WHERE display_publicly = true;
CREATE INDEX idx_reviews_rating ON public.reviews(rating);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view public reviews"
  ON public.reviews FOR SELECT
  USING (display_publicly = true);

CREATE POLICY "Admins can view all reviews"
  ON public.reviews FOR SELECT
  USING (is_admin());

CREATE POLICY "Users can insert their own reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any review"
  ON public.reviews FOR UPDATE
  USING (is_admin());

CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any review"
  ON public.reviews FOR DELETE
  USING (is_admin());

-- Validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_review_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_review_rating_trigger
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_review_rating();

-- Auto-generate initials trigger
CREATE OR REPLACE FUNCTION public.set_review_initials()
RETURNS TRIGGER AS $$
DECLARE
  words TEXT[];
BEGIN
  IF NEW.reviewer_name IS NULL OR NEW.reviewer_name = '' THEN
    NEW.reviewer_initials := 'U';
  ELSE
    words := string_to_array(trim(NEW.reviewer_name), ' ');
    IF array_length(words, 1) >= 2 THEN
      NEW.reviewer_initials := upper(substring(words[1], 1, 1)) || upper(substring(words[2], 1, 1));
    ELSE
      NEW.reviewer_initials := upper(substring(words[1], 1, 1));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER review_initials_trigger
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.set_review_initials();

-- Review statistics RPC function
CREATE OR REPLACE FUNCTION public.get_review_stats()
RETURNS TABLE (
  avg_rating NUMERIC,
  total_reviews BIGINT,
  five_star BIGINT,
  four_star BIGINT,
  three_star BIGINT,
  two_star BIGINT,
  one_star BIGINT,
  recommend_pct INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(AVG(r.rating)::NUMERIC, 1) as avg_rating,
    COUNT(*) as total_reviews,
    COUNT(*) FILTER (WHERE r.rating = 5) as five_star,
    COUNT(*) FILTER (WHERE r.rating = 4) as four_star,
    COUNT(*) FILTER (WHERE r.rating = 3) as three_star,
    COUNT(*) FILTER (WHERE r.rating = 2) as two_star,
    COUNT(*) FILTER (WHERE r.rating = 1) as one_star,
    COALESCE(ROUND((COUNT(*) FILTER (WHERE r.rating >= 4)::NUMERIC / NULLIF(COUNT(*), 0) * 100))::INTEGER, 0) as recommend_pct
  FROM public.reviews r
  WHERE r.display_publicly = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_review_stats() TO anon, authenticated;
