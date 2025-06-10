
-- Create content_items table to replace in-memory storage
CREATE TABLE public.content_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('scholarship', 'job', 'mcq', 'past_paper', 'quiz')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_by UUID,
  
  -- File storage
  image_url TEXT,
  file_url TEXT,
  
  -- Category-specific fields
  deadline TIMESTAMP WITH TIME ZONE,
  department TEXT,
  government_level TEXT,
  cadre TEXT,
  scholarship_type TEXT,
  institution TEXT,
  exam_type TEXT,
  exam_year TEXT,
  
  -- SEO fields
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  
  -- MCQ and Quiz specific fields
  subject TEXT,
  topic TEXT,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  explanation TEXT,
  options JSONB,
  correct_option TEXT CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  time_limit INTEGER,
  marks INTEGER,
  questions JSONB DEFAULT '[]',
  
  -- Visibility settings
  show_in_subjects BOOLEAN DEFAULT true,
  show_in_syllabus BOOLEAN DEFAULT false,
  show_in_mock_tests BOOLEAN DEFAULT false
);

-- Create indexes for better performance
CREATE INDEX idx_content_items_category ON public.content_items(category);
CREATE INDEX idx_content_items_status ON public.content_items(status);
CREATE INDEX idx_content_items_subject ON public.content_items(subject);
CREATE INDEX idx_content_items_topic ON public.content_items(topic);
CREATE INDEX idx_content_items_created_at ON public.content_items(created_at);

-- Enable Row Level Security
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

-- Create policies for content access
CREATE POLICY "Anyone can view approved content" 
  ON public.content_items 
  FOR SELECT 
  USING (status = 'approved');

CREATE POLICY "Authenticated users can create content" 
  ON public.content_items 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own content" 
  ON public.content_items 
  FOR UPDATE 
  TO authenticated
  USING (created_by = auth.uid());

-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('content-files', 'content-files', true);

-- Create storage policies
CREATE POLICY "Anyone can view uploaded files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'content-files');

CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'content-files');

-- Create user_quiz_attempts table for tracking progress
CREATE TABLE public.user_quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.content_items(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  time_taken INTEGER, -- in seconds
  answers JSONB DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, content_id, completed_at)
);

-- Enable RLS for quiz attempts
ALTER TABLE public.user_quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quiz attempts" 
  ON public.user_quiz_attempts 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz attempts" 
  ON public.user_quiz_attempts 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create subjects table for better organization
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create topics table
CREATE TABLE public.topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(subject_id, name)
);

-- Insert some default subjects
INSERT INTO public.subjects (name, description, category) VALUES
  ('Mathematics', 'Mathematical concepts and problem solving', 'Science'),
  ('Physics', 'Physical sciences and natural phenomena', 'Science'),
  ('Chemistry', 'Chemical processes and reactions', 'Science'),
  ('Biology', 'Life sciences and biological systems', 'Science'),
  ('English', 'Language arts and literature', 'Language'),
  ('Computer Science', 'Computing and programming concepts', 'Technology'),
  ('General Knowledge', 'Current affairs and general awareness', 'General'),
  ('Reasoning', 'Logical and analytical reasoning', 'Aptitude');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for content_items
CREATE TRIGGER update_content_items_updated_at 
  BEFORE UPDATE ON public.content_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
