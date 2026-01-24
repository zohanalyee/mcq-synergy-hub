-- Create the external_opportunities table
CREATE TABLE public.external_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  apply_url TEXT NOT NULL UNIQUE,
  image_url TEXT,
  source_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('job', 'scholarship')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  deadline_date DATE,
  location TEXT,
  organization TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.external_opportunities ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE TRIGGER update_external_opportunities_updated_at
  BEFORE UPDATE ON public.external_opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
-- Policy 1: Public can view ONLY approved opportunities
CREATE POLICY "Anyone can view approved opportunities"
  ON public.external_opportunities
  FOR SELECT
  USING (status = 'approved');

-- Policy 2: Admins have full access
CREATE POLICY "Admins can manage all opportunities"
  ON public.external_opportunities
  FOR ALL
  USING (is_admin());

-- Create indexes for common queries
CREATE INDEX idx_external_opportunities_status ON public.external_opportunities(status);
CREATE INDEX idx_external_opportunities_type ON public.external_opportunities(type);
CREATE INDEX idx_external_opportunities_deadline ON public.external_opportunities(deadline_date);