-- Drop the existing unique constraint on name only
ALTER TABLE public.subjects DROP CONSTRAINT IF EXISTS subjects_name_key;

-- Add new composite unique constraint on (name, level_id)
-- This allows "Physics" in Class 9 AND "Physics" in Class 10
ALTER TABLE public.subjects 
ADD CONSTRAINT subjects_name_level_unique UNIQUE (name, level_id);

-- Create a partial index for subjects without level_id (legacy data)
-- This ensures unassigned subjects still have unique names among themselves
CREATE UNIQUE INDEX IF NOT EXISTS subjects_name_null_level_unique 
ON public.subjects (name) 
WHERE level_id IS NULL;