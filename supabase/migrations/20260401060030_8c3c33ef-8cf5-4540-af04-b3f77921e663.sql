
-- Add hybrid scraping columns to scraping_sources
ALTER TABLE scraping_sources 
ADD COLUMN IF NOT EXISTS needs_firecrawl boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS scraper_preference text DEFAULT 'auto',
ADD COLUMN IF NOT EXISTS last_scraper_used text,
ADD COLUMN IF NOT EXISTS firecrawl_crawl_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS firecrawl_max_depth integer DEFAULT 2;

-- Add check constraint for scraper_preference
ALTER TABLE scraping_sources
ADD CONSTRAINT scraping_sources_scraper_preference_check 
CHECK (scraper_preference IN ('auto', 'cheerio', 'firecrawl'));

-- Create scraping_attempts table
CREATE TABLE scraping_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES scraping_sources(id) ON DELETE CASCADE NOT NULL,
  scraper_used text NOT NULL,
  success boolean NOT NULL,
  items_found integer DEFAULT 0,
  error_message text,
  execution_time_ms integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_scraping_attempts_source ON scraping_attempts(source_id);
CREATE INDEX idx_scraping_attempts_created ON scraping_attempts(created_at);

-- Enable RLS
ALTER TABLE scraping_attempts ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admin access scraping attempts"
ON scraping_attempts FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());
