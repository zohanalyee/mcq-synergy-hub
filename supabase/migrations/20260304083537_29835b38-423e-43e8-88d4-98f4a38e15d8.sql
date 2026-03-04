
-- Create navigation_items table
CREATE TABLE public.navigation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  icon TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  parent_id UUID REFERENCES public.navigation_items(id) ON DELETE SET NULL,
  target_audience TEXT DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;

-- Public can view visible items
CREATE POLICY "Public can view visible navigation items"
  ON public.navigation_items FOR SELECT
  TO public
  USING (is_visible = true);

-- Admins can manage all
CREATE POLICY "Admins can manage navigation items"
  ON public.navigation_items FOR ALL
  TO authenticated
  USING (is_admin());

-- Seed current navigation
INSERT INTO public.navigation_items (label, href, icon, position, is_visible, target_audience) VALUES
  ('Home', '/', 'BookOpen', 0, true, 'all'),
  ('Subjects', '/subjects', 'FileText', 1, true, 'all'),
  ('Quizzes', '/quizzes', 'Target', 2, true, 'all'),
  ('Recruitment Tests', '/mock-tests', 'Briefcase', 3, true, 'all'),
  ('Jobs', '/jobs', 'Briefcase', 4, true, 'all'),
  ('Custom Syllabus', '/custom-syllabus', 'GraduationCap', 5, true, 'all'),
  ('Scholarships', '/scholarships', 'Users', 6, true, 'all'),
  ('Tools', '/tools', 'Wrench', 7, true, 'all');
