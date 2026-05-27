
-- Add missing educational systems referenced by SEO landing pages
INSERT INTO public.educational_systems (name, type, description, is_active, approved, auto_created, created_by_ai)
VALUES
  ('Competitive Exams', 'academic', 'University admission tests: MDCAT, ECAT, NUST NET, NUMS, UHS', true, true, false, false),
  ('Civil Services', 'job', 'CSS, PMS, PPSC, FPSC, SPSC, NTS, KPPSC, BPSC competitive exams', true, true, false, false),
  ('Forces & Defence', 'job', 'Pak Army, PAF, Navy, ASF, Rangers, FIA, FC recruitment tests', true, true, false, false),
  ('Teaching Tests', 'job', 'PST, SST, JEST, HST, Educators recruitment tests', true, true, false, false),
  ('Federal Board of Intermediate and Secondary Education (FBISE)', 'academic', 'Federal Board curriculum (Classes 1–12)', true, true, false, false),
  ('Khyber Pakhtunkhwa Textbook Board (KPTBB)', 'academic', 'KP Board curriculum (Classes 1–12)', true, true, false, false),
  ('Balochistan Textbook Board (BBISE)', 'academic', 'Balochistan Board curriculum (Classes 1–12)', true, true, false, false),
  ('AJK Board (Mirpur)', 'academic', 'Azad Jammu & Kashmir Board curriculum (Classes 1–12)', true, true, false, false)
ON CONFLICT (name) DO NOTHING;

-- Hide cleanup placeholder systems from public LMS without deleting their content
UPDATE public.educational_systems
SET is_active = false, approved = false
WHERE name IN ('Unknown', 'Test');
