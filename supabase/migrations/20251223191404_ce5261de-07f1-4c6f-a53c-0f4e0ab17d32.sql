-- Insert Sample Jobs into content_items
INSERT INTO public.content_items (title, description, category, department, deadline, government_level, status) VALUES 
('Assistant Director - FIA', 'Federal Public Service Commission (FPSC) announces posts for AD FIA.', 'job', 'FIA', '2025-05-30', 'Federal', 'approved'),
('Software Engineer - State Bank', 'State Bank of Pakistan OG-2 Officer positions.', 'job', 'SBP', '2025-06-15', 'Federal', 'approved');

-- Insert Sample Past Paper
INSERT INTO public.content_items (title, description, category, exam_year, exam_type, institution, status) VALUES 
('Physics 2023 - Board Exam', 'Complete solved past paper for Inter Part 2.', 'past_paper', '2023', 'Board Exam', 'Federal Board', 'approved');