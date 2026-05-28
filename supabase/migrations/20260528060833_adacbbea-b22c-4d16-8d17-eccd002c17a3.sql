ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS highlights jsonb,
  ADD COLUMN IF NOT EXISTS structured_tables jsonb,
  ADD COLUMN IF NOT EXISTS faqs jsonb,
  ADD COLUMN IF NOT EXISTS internal_links jsonb,
  ADD COLUMN IF NOT EXISTS prep_blocks jsonb,
  ADD COLUMN IF NOT EXISTS sources jsonb,
  ADD COLUMN IF NOT EXISTS jobposting jsonb,
  ADD COLUMN IF NOT EXISTS schema_type text,
  ADD COLUMN IF NOT EXISTS reading_time_minutes int,
  ADD COLUMN IF NOT EXISTS last_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS og_title text,
  ADD COLUMN IF NOT EXISTS twitter_title text;