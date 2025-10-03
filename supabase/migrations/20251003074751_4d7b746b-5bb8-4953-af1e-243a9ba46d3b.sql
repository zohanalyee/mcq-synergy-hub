-- Drop the existing check constraint on content_items.status
ALTER TABLE content_items DROP CONSTRAINT IF EXISTS content_items_status_check;

-- Add the updated check constraint with 'question_bank' as a valid status
ALTER TABLE content_items ADD CONSTRAINT content_items_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'question_bank'));