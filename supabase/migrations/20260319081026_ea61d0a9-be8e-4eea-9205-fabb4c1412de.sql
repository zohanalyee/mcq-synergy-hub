
-- Create user_feedback table
CREATE TABLE public.user_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stars INTEGER NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'new',
  admin_notes TEXT
);

-- Create indexes
CREATE INDEX idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX idx_user_feedback_category ON public.user_feedback(category);
CREATE INDEX idx_user_feedback_stars ON public.user_feedback(stars);
CREATE INDEX idx_user_feedback_status ON public.user_feedback(status);
CREATE INDEX idx_user_feedback_created_at ON public.user_feedback(created_at DESC);

-- Validation trigger for stars
CREATE OR REPLACE FUNCTION public.validate_user_feedback()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stars < 1 OR NEW.stars > 5 THEN
    RAISE EXCEPTION 'Stars must be between 1 and 5';
  END IF;
  IF NEW.category NOT IN ('Content', 'Design', 'Technical', 'Other') THEN
    RAISE EXCEPTION 'Invalid category';
  END IF;
  IF NEW.status NOT IN ('new', 'reviewed', 'addressed', 'archived') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_user_feedback_trigger
  BEFORE INSERT OR UPDATE ON public.user_feedback
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_feedback();

-- Update trigger
CREATE TRIGGER update_user_feedback_updated_at
  BEFORE UPDATE ON public.user_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit feedback"
  ON public.user_feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
  ON public.user_feedback FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
  ON public.user_feedback FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update feedback"
  ON public.user_feedback FOR UPDATE TO authenticated
  USING (public.is_admin());

-- Stats function
CREATE OR REPLACE FUNCTION public.get_feedback_stats()
RETURNS TABLE (
  avg_rating NUMERIC,
  total_feedback BIGINT,
  five_stars BIGINT,
  four_stars BIGINT,
  three_stars BIGINT,
  two_stars BIGINT,
  one_star BIGINT,
  content_count BIGINT,
  design_count BIGINT,
  technical_count BIGINT,
  other_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  RETURN QUERY
  SELECT
    ROUND(AVG(uf.stars)::NUMERIC, 1),
    COUNT(*),
    COUNT(*) FILTER (WHERE uf.stars = 5),
    COUNT(*) FILTER (WHERE uf.stars = 4),
    COUNT(*) FILTER (WHERE uf.stars = 3),
    COUNT(*) FILTER (WHERE uf.stars = 2),
    COUNT(*) FILTER (WHERE uf.stars = 1),
    COUNT(*) FILTER (WHERE uf.category = 'Content'),
    COUNT(*) FILTER (WHERE uf.category = 'Design'),
    COUNT(*) FILTER (WHERE uf.category = 'Technical'),
    COUNT(*) FILTER (WHERE uf.category = 'Other')
  FROM public.user_feedback uf;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_feedback_stats() TO authenticated;
