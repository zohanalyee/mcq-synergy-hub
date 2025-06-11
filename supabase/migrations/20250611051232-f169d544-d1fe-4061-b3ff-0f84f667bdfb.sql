
-- Add indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_content_items_category ON content_items(category);
CREATE INDEX IF NOT EXISTS idx_content_items_subject ON content_items(subject);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);

-- Create a table for test attempts with proper relationships
CREATE TABLE IF NOT EXISTS test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL, -- 'subject', 'job', 'custom', 'timed'
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  time_taken INTEGER, -- in seconds
  answers JSONB DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on test_attempts
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies for test_attempts (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_attempts' AND policyname = 'Users can view their own test attempts') THEN
        CREATE POLICY "Users can view their own test attempts" 
          ON test_attempts FOR SELECT 
          USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_attempts' AND policyname = 'Users can create their own test attempts') THEN
        CREATE POLICY "Users can create their own test attempts" 
          ON test_attempts FOR INSERT 
          WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Add indexes for test_attempts
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_content_id ON test_attempts(content_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_test_type ON test_attempts(test_type);

-- Create a table for job categories to better organize job tests
CREATE TABLE IF NOT EXISTS job_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  government_level TEXT, -- 'federal', 'provincial', 'local'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some default job categories
INSERT INTO job_categories (name, description, government_level) VALUES
('CSS (Central Superior Services)', 'Central Superior Services examination', 'federal'),
('PCS (Provincial Civil Services)', 'Provincial Civil Services examination', 'provincial'),
('Banking', 'Banking sector jobs and tests', 'federal'),
('Teaching', 'Education sector positions', 'provincial'),
('Police', 'Law enforcement positions', 'provincial'),
('Health', 'Medical and health sector jobs', 'federal')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on job_categories (read-only for users)
ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for job_categories (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_categories' AND policyname = 'Anyone can view job categories') THEN
        CREATE POLICY "Anyone can view job categories" 
          ON job_categories FOR SELECT 
          TO public USING (true);
    END IF;
END $$;

-- Create a junction table for custom syllabus (many-to-many between users and topics)
CREATE TABLE IF NOT EXISTS user_custom_syllabus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

-- Enable RLS on user_custom_syllabus
ALTER TABLE user_custom_syllabus ENABLE ROW LEVEL SECURITY;

-- Create policy for user_custom_syllabus (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_custom_syllabus' AND policyname = 'Users can manage their own custom syllabus') THEN
        CREATE POLICY "Users can manage their own custom syllabus" 
          ON user_custom_syllabus FOR ALL 
          USING (auth.uid() = user_id);
    END IF;
END $$;

-- Add indexes for user_custom_syllabus
CREATE INDEX IF NOT EXISTS idx_user_custom_syllabus_user_id ON user_custom_syllabus(user_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_syllabus_topic_id ON user_custom_syllabus(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_syllabus_subject_id ON user_custom_syllabus(subject_id);
