-- Add new columns for filtering external opportunities
ALTER TABLE public.external_opportunities
ADD COLUMN IF NOT EXISTS sector TEXT CHECK (sector IN ('government', 'private')),
ADD COLUMN IF NOT EXISTS region TEXT CHECK (region IN ('sindh', 'punjab', 'kpk', 'balochistan', 'federal', 'international', 'other')),
ADD COLUMN IF NOT EXISTS scholarship_scope TEXT CHECK (scholarship_scope IN ('national', 'international'));

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_external_opportunities_sector ON public.external_opportunities(sector);
CREATE INDEX IF NOT EXISTS idx_external_opportunities_region ON public.external_opportunities(region);
CREATE INDEX IF NOT EXISTS idx_external_opportunities_scholarship_scope ON public.external_opportunities(scholarship_scope);