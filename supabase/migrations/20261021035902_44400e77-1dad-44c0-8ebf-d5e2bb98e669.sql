CREATE TABLE public.pdf_practice_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id uuid NOT NULL,
  title text NOT NULL,
  set_number integer NOT NULL DEFAULT 1,
  hub_slug text NOT NULL,
  question_count integer NOT NULL,
  section_split jsonb NOT NULL DEFAULT '[]'::jsonb,
  seed bigint NOT NULL,
  question_ids uuid[] NOT NULL DEFAULT '{}',
  options_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  require_explanation boolean NOT NULL DEFAULT false,
  gate_passed_only boolean NOT NULL DEFAULT false,
  gate_passed_count integer NOT NULL DEFAULT 0,
  file_name text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pdf_practice_sets TO authenticated;
GRANT ALL ON public.pdf_practice_sets TO service_role;
ALTER TABLE public.pdf_practice_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage pdf practice sets" ON public.pdf_practice_sets
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER update_pdf_practice_sets_updated_at BEFORE UPDATE ON public.pdf_practice_sets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();