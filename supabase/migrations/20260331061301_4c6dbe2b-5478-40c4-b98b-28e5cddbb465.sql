
-- Add tender-specific columns to external_opportunities
ALTER TABLE public.external_opportunities ADD COLUMN IF NOT EXISTS tender_number TEXT;
ALTER TABLE public.external_opportunities ADD COLUMN IF NOT EXISTS tender_value TEXT;
ALTER TABLE public.external_opportunities ADD COLUMN IF NOT EXISTS tender_category TEXT;
ALTER TABLE public.external_opportunities ADD COLUMN IF NOT EXISTS document_url TEXT;
ALTER TABLE public.external_opportunities ADD COLUMN IF NOT EXISTS pre_bid_meeting DATE;

-- Create board_result_announcements table
CREATE TABLE public.board_result_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_name TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  year INTEGER NOT NULL,
  result_url TEXT NOT NULL,
  announced_at TIMESTAMPTZ DEFAULT NOW(),
  blog_generated BOOLEAN DEFAULT false,
  blog_id UUID REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(board_name, exam_type, year)
);

ALTER TABLE public.board_result_announcements ENABLE ROW LEVEL SECURITY;

-- Admin can manage all
CREATE POLICY "Admins can manage board result announcements"
  ON public.board_result_announcements FOR ALL TO public
  USING (is_admin()) WITH CHECK (is_admin());

-- Public can view announced results
CREATE POLICY "Anyone can view board result announcements"
  ON public.board_result_announcements FOR SELECT TO public
  USING (true);
