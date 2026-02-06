-- ============= NORMALIZE DIFFICULTY VALUES =============
-- Standardize all difficulty values to Title Case (Easy, Medium, Hard)

-- Update content_items
UPDATE content_items
SET difficulty = 
  CASE 
    WHEN LOWER(difficulty) = 'easy' THEN 'Easy'
    WHEN LOWER(difficulty) = 'medium' THEN 'Medium'
    WHEN LOWER(difficulty) = 'hard' THEN 'Hard'
    WHEN LOWER(difficulty) = 'mixed' THEN 'Medium'
    ELSE 'Medium'
  END
WHERE difficulty IS NOT NULL 
  AND difficulty NOT IN ('Easy', 'Medium', 'Hard');

-- Update content_submissions  
UPDATE content_submissions
SET difficulty = 
  CASE 
    WHEN LOWER(difficulty) = 'easy' THEN 'Easy'
    WHEN LOWER(difficulty) = 'medium' THEN 'Medium'
    WHEN LOWER(difficulty) = 'hard' THEN 'Hard'
    WHEN LOWER(difficulty) = 'mixed' THEN 'Medium'
    ELSE 'Medium'
  END
WHERE difficulty IS NOT NULL 
  AND difficulty NOT IN ('Easy', 'Medium', 'Hard');

-- Add check constraint to prevent future inconsistencies
ALTER TABLE content_items 
DROP CONSTRAINT IF EXISTS content_items_difficulty_check;

ALTER TABLE content_items 
ADD CONSTRAINT content_items_difficulty_check 
CHECK (difficulty IS NULL OR difficulty IN ('Easy', 'Medium', 'Hard'));

ALTER TABLE content_submissions 
DROP CONSTRAINT IF EXISTS content_submissions_difficulty_check;

ALTER TABLE content_submissions 
ADD CONSTRAINT content_submissions_difficulty_check 
CHECK (difficulty IS NULL OR difficulty IN ('Easy', 'Medium', 'Hard'));

-- Add useful indexes for common queries
CREATE INDEX IF NOT EXISTS idx_content_items_topic_id ON content_items(topic_id);
CREATE INDEX IF NOT EXISTS idx_content_items_source_type ON content_items(source_type);
CREATE INDEX IF NOT EXISTS idx_content_items_category_status ON content_items(category, status);
CREATE INDEX IF NOT EXISTS idx_documents_topic_id ON documents(topic_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);