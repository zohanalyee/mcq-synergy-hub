-- Drop existing check constraint and recreate with 'flagged_duplicate' status
ALTER TABLE public.content_items DROP CONSTRAINT IF EXISTS content_items_status_check;

-- Add the updated check constraint that includes 'flagged_duplicate'
ALTER TABLE public.content_items 
ADD CONSTRAINT content_items_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'question_bank', 'flagged_duplicate'));