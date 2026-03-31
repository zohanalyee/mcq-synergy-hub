
-- Scraping sources configuration table
CREATE TABLE scraping_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('scholarship', 'job', 'tender', 'board_result')),
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  scraping_frequency TEXT DEFAULT 'weekly' CHECK (scraping_frequency IN ('daily', 'weekly', 'monthly', 'on_demand')),
  last_scraped_at TIMESTAMPTZ,
  last_scrape_found INTEGER DEFAULT 0,
  last_scrape_saved INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  custom_selectors JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_scraping_sources_type ON scraping_sources(type);
CREATE INDEX idx_scraping_sources_active ON scraping_sources(is_active) WHERE is_active = true;
CREATE INDEX idx_scraping_sources_type_active ON scraping_sources(type, is_active) WHERE is_active = true;

-- RLS
ALTER TABLE scraping_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage scraping sources"
  ON scraping_sources FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Seed scholarship sources
INSERT INTO scraping_sources (type, name, url, scraping_frequency, notes) VALUES
('scholarship', 'HEC Scholarships', 'https://hec.gov.pk/english/scholarshipsgrants/Pages/default.aspx', 'weekly', 'Official HEC portal - main source'),
('scholarship', 'NUST Financial Aid', 'https://nust.edu.pk/admissions/financial-assistance/', 'monthly', 'NUST university scholarships'),
('scholarship', 'LUMS Financial Aid', 'https://lums.edu.pk/admissions/scholarships', 'monthly', 'LUMS scholarships and aid'),
('scholarship', 'PM Youth Program', 'https://www.pmo.gov.pk/youth.html', 'weekly', 'PM office youth initiatives');

-- Seed job sources
INSERT INTO scraping_sources (type, name, url, scraping_frequency, notes) VALUES
('job', 'PPSC Jobs', 'https://www.ppsc.gop.pk/index_an.php', 'daily', 'Punjab Public Service Commission'),
('job', 'FPSC Jobs', 'https://www.fpsc.gov.pk/jobs', 'weekly', 'Federal Public Service Commission'),
('job', 'NTS Jobs', 'https://www.nts.org.pk/', 'weekly', 'National Testing Service'),
('job', 'State Bank Careers', 'https://www.sbp.org.pk/careers/', 'monthly', 'State Bank of Pakistan');
