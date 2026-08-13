CREATE TABLE IF NOT EXISTS public.subject_aliases (
  alias text PRIMARY KEY,
  canonical text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.subject_aliases TO authenticated;
GRANT ALL ON public.subject_aliases TO service_role;

ALTER TABLE public.subject_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subject_aliases_read_auth" ON public.subject_aliases
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "subject_aliases_admin_manage" ON public.subject_aliases
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.subject_aliases (alias, canonical) VALUES
  ('English', 'english'),
  ('Basic English', 'english'),
  ('English Language', 'english'),
  ('English (MCQs)', 'english'),
  ('English Grammar and Comprehension', 'english'),
  ('English Grammar & Content Knowledge', 'english'),
  ('Part I: English', 'english'),
  ('General Knowledge', 'general_knowledge'),
  ('General Knowledge and Current Affairs', 'general_knowledge'),
  ('General Knowledge & Current Affairs', 'general_knowledge'),
  ('General Knowledge (MCQs)', 'general_knowledge'),
  ('General Knowledge (Pakistan & Current Affairs)', 'general_knowledge'),
  ('General Knowledge & Everyday Science', 'general_knowledge'),
  ('Mathematics', 'mathematics'),
  ('Basic Mathematics', 'mathematics'),
  ('Basic Mathematics (MCQs)', 'mathematics'),
  ('Mathematics (Basic Arithmetic)', 'mathematics'),
  ('Basic Arithmetic', 'mathematics'),
  ('Basic Arithmetic and Quantitative Reasoning', 'mathematics'),
  ('Quantitative', 'mathematics'),
  ('Quantitative Reasoning', 'mathematics'),
  ('Part I: Mathematics', 'mathematics'),
  ('Basic Computer', 'computer_ms_office'),
  ('Basic Computer Knowledge', 'computer_ms_office'),
  ('Basic Computer Knowledge (MS Office)', 'computer_ms_office'),
  ('Basic Computer & MS Office', 'computer_ms_office'),
  ('Computer Literacy / MS Office', 'computer_ms_office'),
  ('Computer (MS Office)', 'computer_ms_office'),
  ('Computer (MS Office & Basic)', 'computer_ms_office'),
  ('Computer (MS Office & Typing Theory)', 'computer_ms_office'),
  ('Computer / IT Knowledge', 'computer_ms_office'),
  ('Information Technology', 'computer_ms_office'),
  ('Windows Ms Word, Excel, Power Point', 'computer_ms_office'),
  ('Analytical Reasoning', 'reasoning_iq'),
  ('Analytical / IQ', 'reasoning_iq'),
  ('IQ', 'reasoning_iq'),
  ('Logical Reasoning', 'reasoning_iq'),
  ('Verbal Reasoning', 'reasoning_iq'),
  ('Islamiat', 'islamiat'),
  ('Islamiat / Ethics', 'islamiat'),
  ('Islamic Knowledge', 'islamiat'),
  ('Islamic Studies / Ethics', 'islamiat'),
  ('Islamic Studies / Ethics (MCQs)', 'islamiat'),
  ('Pakistan Studies', 'pakistan_studies'),
  ('Pakistan Studies (MCQs)', 'pakistan_studies'),
  ('General Science', 'general_science'),
  ('Part I: General Science', 'general_science')
ON CONFLICT (alias) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_subject_aliases(p_subject text)
RETURNS TABLE (subject text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT a2.alias
  FROM public.subject_aliases a1
  JOIN public.subject_aliases a2 ON a2.canonical = a1.canonical
  WHERE lower(a1.alias) = lower(trim(p_subject))
  UNION
  SELECT trim(p_subject)
$$;

GRANT EXECUTE ON FUNCTION public.get_subject_aliases(text) TO authenticated, service_role;
