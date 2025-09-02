-- Create subtopics table for hierarchical question organization
CREATE TABLE public.subtopics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add subtopic reference to content_items
ALTER TABLE public.content_items 
ADD COLUMN subtopic TEXT;

-- Add question bank specific fields
ALTER TABLE public.content_items 
ADD COLUMN question_type TEXT DEFAULT 'mcq',
ADD COLUMN reference_material TEXT,
ADD COLUMN last_used_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN usage_count INTEGER DEFAULT 0,
ADD COLUMN is_featured BOOLEAN DEFAULT false;

-- Create question tags table for better organization
CREATE TABLE public.question_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for question-tag relationships
CREATE TABLE public.content_question_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES public.content_items(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.question_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(content_id, tag_id)
);

-- Create custom test sessions for generated tests
CREATE TABLE public.custom_test_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_name TEXT NOT NULL,
  subjects JSONB DEFAULT '[]'::jsonb,
  topics JSONB DEFAULT '[]'::jsonb,
  subtopics JSONB DEFAULT '[]'::jsonb,
  difficulty_levels JSONB DEFAULT '["Easy","Medium","Hard"]'::jsonb,
  question_count INTEGER NOT NULL DEFAULT 10,
  time_limit INTEGER NOT NULL DEFAULT 30,
  questions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create downloads tracking table
CREATE TABLE public.content_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  download_type TEXT NOT NULL, -- 'pdf', 'word', 'excel'
  content_filter JSONB, -- stores filter criteria used
  file_name TEXT,
  download_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Insert some default question tags
INSERT INTO public.question_tags (name, description, color) VALUES
('Past Paper', 'Questions from previous examinations', '#ef4444'),
('Conceptual', 'Theory and concept-based questions', '#3b82f6'),
('Problem Solving', 'Mathematical and analytical questions', '#10b981'),
('Current Affairs', 'Recent events and developments', '#f59e0b'),
('Basic', 'Fundamental level questions', '#8b5cf6'),
('Advanced', 'Complex and challenging questions', '#ec4899');

-- Enable RLS on new tables
ALTER TABLE public.subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_question_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_downloads ENABLE ROW LEVEL SECURITY;

-- RLS policies for subtopics (public read, admin write)
CREATE POLICY "Anyone can view subtopics" ON public.subtopics FOR SELECT USING (true);
CREATE POLICY "Admins can manage subtopics" ON public.subtopics FOR ALL USING (is_admin());

-- RLS policies for question tags (public read, admin write)
CREATE POLICY "Anyone can view question tags" ON public.question_tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage question tags" ON public.question_tags FOR ALL USING (is_admin());

-- RLS policies for content question tags (public read, admin write)
CREATE POLICY "Anyone can view content question tags" ON public.content_question_tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage content question tags" ON public.content_question_tags FOR ALL USING (is_admin());

-- RLS policies for custom test sessions (users can manage their own)
CREATE POLICY "Users can view their own test sessions" ON public.custom_test_sessions 
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own test sessions" ON public.custom_test_sessions 
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own test sessions" ON public.custom_test_sessions 
FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own test sessions" ON public.custom_test_sessions 
FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all test sessions" ON public.custom_test_sessions 
FOR SELECT USING (is_admin());

-- RLS policies for content downloads (users can view their own)
CREATE POLICY "Users can view their own downloads" ON public.content_downloads 
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own downloads" ON public.content_downloads 
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all downloads" ON public.content_downloads 
FOR SELECT USING (is_admin());