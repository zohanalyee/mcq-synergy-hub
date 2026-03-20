
-- Add new columns to profiles table for mandatory profile completion
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS occupation text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

-- Create index for profile completion checks
CREATE INDEX IF NOT EXISTS idx_profiles_completed ON public.profiles(profile_completed);
