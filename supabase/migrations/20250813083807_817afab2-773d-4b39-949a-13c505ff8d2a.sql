-- Create content_submissions table for bulk uploads
CREATE TABLE public.content_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('scholarship', 'job', 'mcq', 'past_paper', 'quiz')),
  tags JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
  
  -- File URLs
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
  show_in_mock_tests BOOLEAN DEFAULT false,
  
  -- Metadata
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT
);

-- Enable Row Level Security
ALTER TABLE public.content_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all content submissions" 
ON public.content_submissions 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can insert content submissions" 
ON public.content_submissions 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can update content submissions" 
ON public.content_submissions 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete content submissions" 
ON public.content_submissions 
FOR DELETE 
USING (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_content_submissions_updated_at
BEFORE UPDATE ON public.content_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_content_submissions_status ON public.content_submissions(status);
CREATE INDEX idx_content_submissions_category ON public.content_submissions(category);
CREATE INDEX idx_content_submissions_created_at ON public.content_submissions(created_at);
CREATE INDEX idx_content_submissions_subject_topic ON public.content_submissions(subject, topic) WHERE subject IS NOT NULL AND topic IS NOT NULL;