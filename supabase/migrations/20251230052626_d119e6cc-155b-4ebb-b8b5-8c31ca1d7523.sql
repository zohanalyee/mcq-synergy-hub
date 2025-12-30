-- Create educational_systems table
CREATE TABLE public.educational_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('academic', 'job')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.educational_systems ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can view, admins can manage
CREATE POLICY "Anyone can view educational systems" 
  ON public.educational_systems FOR SELECT USING (true);

CREATE POLICY "Admins can manage educational systems" 
  ON public.educational_systems FOR ALL USING (is_admin());

-- Create levels table
CREATE TABLE public.levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID REFERENCES public.educational_systems(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(system_id, name)
);

-- Enable RLS
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view levels" 
  ON public.levels FOR SELECT USING (true);

CREATE POLICY "Admins can manage levels" 
  ON public.levels FOR ALL USING (is_admin());

-- Update subjects table - Add level_id column
ALTER TABLE public.subjects 
ADD COLUMN level_id UUID REFERENCES public.levels(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_subjects_level_id ON public.subjects(level_id);

-- Update profiles table - Add active_learning_context
ALTER TABLE public.profiles 
ADD COLUMN active_learning_context JSONB DEFAULT '{}';