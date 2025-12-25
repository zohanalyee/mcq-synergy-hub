-- First, remove duplicate MCQ questions keeping only the most recent one
-- Then create the unique index

-- Delete duplicates, keeping the one with the latest updated_at
DELETE FROM public.content_items
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY title ORDER BY updated_at DESC) as rn
    FROM public.content_items
    WHERE category = 'mcq' AND status = 'approved'
  ) t
  WHERE t.rn > 1
);

-- Now create the unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_items_title_mcq_unique 
ON public.content_items (title) 
WHERE category = 'mcq' AND status = 'approved';
