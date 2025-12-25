-- FIX #2: Add UNIQUE constraint on question text to prevent duplicates
-- Using MD5 hash of title for performance on long text (MCQ questions)
-- Only applies to mcq category items

CREATE UNIQUE INDEX IF NOT EXISTS content_items_mcq_title_unique_idx 
ON public.content_items (md5(title::text)) 
WHERE category = 'mcq';

-- Add a comment explaining the index
COMMENT ON INDEX content_items_mcq_title_unique_idx IS 'Prevents duplicate MCQ questions by enforcing unique question text (via MD5 hash)';