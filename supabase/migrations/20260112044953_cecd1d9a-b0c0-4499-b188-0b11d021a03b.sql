-- Add location and apply_link columns to content_items
ALTER TABLE content_items 
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS apply_link text;

-- Add location and apply_link columns to content_submissions
ALTER TABLE content_submissions 
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS apply_link text;