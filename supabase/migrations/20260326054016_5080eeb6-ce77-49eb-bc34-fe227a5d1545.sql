
-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL DEFAULT '',
  excerpt text,
  category text,
  tags text[] DEFAULT '{}',
  image_url text,
  author_name text DEFAULT 'MCQSAI Team',
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  meta_title text,
  meta_description text
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published blog posts" ON public.blog_posts
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage all blog posts" ON public.blog_posts
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Create faq_items table
CREATE TABLE public.faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'General',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active FAQ items" ON public.faq_items
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all FAQ items" ON public.faq_items
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Seed 5 blog posts
INSERT INTO public.blog_posts (title, slug, content, excerpt, category, status, published_at, tags) VALUES
('MDCAT Preparation Strategy 2026', 'mdcat-preparation-strategy-2026',
 E'## Complete MDCAT Preparation Guide\n\nPreparing for MDCAT requires a structured approach combining conceptual understanding with regular practice.\n\n### 1. Understand the Syllabus\nThe MDCAT syllabus covers Biology, Chemistry, Physics, and English. Start by downloading the official PMC syllabus and mapping out all topics.\n\n### 2. Create a Study Schedule\nDivide your preparation into phases:\n- **Phase 1 (Months 1-2):** Complete syllabus coverage\n- **Phase 2 (Month 3):** Revision and practice MCQs\n- **Phase 3 (Month 4):** Mock tests and weak area improvement\n\n### 3. Practice MCQs Daily\nUse MCQsAI to practice topic-wise MCQs. Aim for at least 100 MCQs per day during your preparation phase.\n\n### 4. Focus on Weak Areas\nTrack your performance analytics to identify weak topics and allocate extra time to them.\n\n### 5. Take Mock Tests\nRegularly attempt full-length mock tests under timed conditions to build exam stamina.',
 'A complete guide to preparing for MDCAT 2026 with study schedules, tips, and practice strategies.',
 'preparation', 'published', now(), ARRAY['mdcat', 'medical', 'preparation']),

('Top Medical Colleges in Sindh', 'top-medical-colleges-sindh',
 E'## Best Medical Colleges in Sindh Province\n\nSindh has several prestigious medical institutions. Here is a comprehensive guide to help you choose.\n\n### 1. Dow University of Health Sciences (DUHS)\nLocated in Karachi, DUHS is one of the oldest and most respected medical universities in Pakistan.\n\n### 2. Aga Khan University (AKU)\nA private institution known for its world-class medical education and research facilities.\n\n### 3. Jinnah Sindh Medical University (JSMU)\nOffers quality medical education with modern facilities in the heart of Karachi.\n\n### 4. Liaquat University of Medical & Health Sciences (LUMHS)\nLocated in Jamshoro, it serves students from across Sindh.\n\n### 5. Peoples University of Medical & Health Sciences (PUMHS)\nSituated in Nawabshah, providing accessible medical education.',
 'Comprehensive guide to the best medical colleges in Sindh with admission requirements and rankings.',
 'colleges', 'published', now(), ARRAY['colleges', 'sindh', 'medical']),

('How to Handle Negative Marking in MCQ Exams', 'handle-negative-marking-mcq-exams',
 E'## Mastering Negative Marking Strategy\n\nNegative marking can significantly impact your score if not handled strategically.\n\n### Understanding the Math\nIn most Pakistani competitive exams:\n- Correct answer: +4 marks\n- Wrong answer: -1 mark\n- Unattempted: 0 marks\n\n### When to Guess\nIf you can eliminate 2 out of 4 options, guessing becomes mathematically favorable.\n\n### The 50% Rule\nIf you are more than 50% confident about an answer, attempt it. The expected value is positive.\n\n### Practice Under Exam Conditions\nUse MCQsAI mock tests with negative marking enabled to build your decision-making skills.\n\n### Time Management\nDon''t spend too long on any single question. Mark difficult questions and return to them later.',
 'Learn effective strategies to deal with negative marking in MDCAT, ECAT, and competitive exams.',
 'tips', 'published', now(), ARRAY['negative-marking', 'strategy', 'tips']),

('CSS Exam Preparation: Complete Guide for Beginners', 'css-exam-preparation-guide',
 E'## CSS Exam Preparation Roadmap\n\nThe Central Superior Services (CSS) exam is Pakistan''s premier civil service examination.\n\n### Exam Structure\nThe CSS exam consists of 12 papers including:\n- Compulsory papers (6)\n- Optional papers (6)\n\n### Recommended Books\n- English Composition: Wren & Martin\n- Pakistan Affairs: Ikram Rabbani\n- Current Affairs: Dawn Editorial reading\n\n### Study Timeline\n- **6 months before:** Start with compulsory subjects\n- **4 months before:** Begin optional subjects\n- **2 months before:** Practice past papers\n- **1 month before:** Revision and mock tests\n\n### MCQ Preparation\nUse MCQsAI for objective-type preparation in General Knowledge, Pakistan Affairs, and Islamiyat.',
 'Complete beginner guide to CSS exam preparation with book recommendations and study timelines.',
 'preparation', 'published', now(), ARRAY['css', 'civil-service', 'preparation']),

('Best Study Techniques for Science Students', 'best-study-techniques-science-students',
 E'## Evidence-Based Study Techniques\n\nResearch shows certain study methods are far more effective than others.\n\n### 1. Active Recall\nInstead of re-reading notes, test yourself. MCQsAI''s practice mode is perfect for this.\n\n### 2. Spaced Repetition\nReview material at increasing intervals: 1 day, 3 days, 7 days, 14 days.\n\n### 3. Feynman Technique\nExplain concepts in simple words. If you can''t explain it simply, you don''t understand it well enough.\n\n### 4. Pomodoro Technique\nStudy in 25-minute focused sessions with 5-minute breaks.\n\n### 5. Mind Mapping\nCreate visual connections between topics for better retention.\n\n### 6. Practice Testing\nRegular self-testing through MCQs is one of the most effective study techniques according to cognitive science research.',
 'Discover proven study techniques backed by science to improve your exam performance.',
 'tips', 'published', now(), ARRAY['study-techniques', 'science', 'learning']);

-- Seed FAQ items
INSERT INTO public.faq_items (question, answer, category, sort_order) VALUES
('What is MCQsAI?', 'MCQsAI is a free AI-powered exam preparation platform designed for Pakistani students. It offers 6000+ MCQs across subjects like Biology, Chemistry, Physics, English, Mathematics, and more for exams like MDCAT, ECAT, CSS, PPSC, and NTS.', 'General', 1),
('Is MCQsAI free to use?', 'Yes! MCQsAI is completely free. All MCQs, mock tests, and study tools are available without any subscription or payment.', 'General', 2),
('Which exams does MCQsAI cover?', 'MCQsAI covers preparation for MDCAT, ECAT, CSS, PPSC, NTS, FPSC, and various board exams. Our question bank spans multiple subjects and difficulty levels.', 'Exams', 3),
('How are the MCQs generated?', 'Our MCQs are created using a combination of AI technology and expert review. Each question goes through a quality assurance process to ensure accuracy and relevance to the Pakistani curriculum.', 'Technical', 4),
('Can I track my progress?', 'Yes! Create a free account to access detailed analytics including subject-wise performance, time tracking, and personalized recommendations based on your weak areas.', 'General', 5),
('How do mock tests work?', 'Mock tests simulate real exam conditions with timed sessions, negative marking options, and detailed result analysis. You can take subject-specific or mixed-subject tests.', 'Exams', 6),
('Is the content available in Urdu?', 'Yes, MCQsAI supports multiple languages including English, Urdu, and Sindhi. You can switch languages from the settings menu.', 'Technical', 7),
('How can I report an incorrect question?', 'If you find any errors in our questions, you can use the feedback button available on each question or contact us at hello@mcqsai.com. We review and fix reported issues promptly.', 'Technical', 8);
