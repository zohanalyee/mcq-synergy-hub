ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS quality_verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_content_items_quality_unverified
  ON public.content_items (created_at)
  WHERE category = 'mcq' AND status = 'approved' AND quality_verified_at IS NULL;