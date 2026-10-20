CREATE TABLE public.quality_wave_tests (
  definition_id uuid PRIMARY KEY,
  wave smallint NOT NULL DEFAULT 1,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quality_wave_tests TO authenticated;
GRANT ALL ON public.quality_wave_tests TO service_role;
ALTER TABLE public.quality_wave_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage quality waves" ON public.quality_wave_tests FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.quality_syllabus_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id uuid NOT NULL,
  section text,
  topic text NOT NULL,
  source_tier text NOT NULL DEFAULT 'C',
  source_url text,
  weight numeric,
  is_banned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (definition_id, topic)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quality_syllabus_topics TO authenticated;
GRANT ALL ON public.quality_syllabus_topics TO service_role;
ALTER TABLE public.quality_syllabus_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage syllabus topics" ON public.quality_syllabus_topics FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.question_quality_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL,
  definition_id uuid NOT NULL,
  checker_version int NOT NULL DEFAULT 1,
  deterministic_ok boolean NOT NULL DEFAULT true,
  reasons text[] NOT NULL DEFAULT '{}',
  ai_verdict text NOT NULL DEFAULT 'pending',
  ai_answers jsonb,
  ai_topic text,
  ai_topic_tier text,
  ai_difficulty text,
  relevant boolean,
  signal_flags text[] NOT NULL DEFAULT '{}',
  owner_decision text,
  checked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (question_id, checker_version)
);
CREATE INDEX ON public.question_quality_reviews (definition_id, ai_verdict);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_quality_reviews TO authenticated;
GRANT ALL ON public.question_quality_reviews TO service_role;
ALTER TABLE public.question_quality_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage quality reviews" ON public.question_quality_reviews FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.quality_job_runs (
  id text PRIMARY KEY DEFAULT 'quality-gate',
  status text NOT NULL DEFAULT 'idle',
  pause_reason text,
  lease_until timestamptz,
  day date NOT NULL DEFAULT current_date,
  calls_today int NOT NULL DEFAULT 0,
  last_run_at timestamptz,
  last_summary jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quality_job_runs TO authenticated;
GRANT ALL ON public.quality_job_runs TO service_role;
ALTER TABLE public.quality_job_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage quality job" ON public.quality_job_runs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
INSERT INTO public.quality_job_runs (id) VALUES ('quality-gate') ON CONFLICT DO NOTHING;

CREATE TABLE public.question_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, DELETE ON public.question_reports TO authenticated;
GRANT ALL ON public.question_reports TO service_role;
ALTER TABLE public.question_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read question reports" ON public.question_reports FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins delete question reports" ON public.question_reports FOR DELETE TO authenticated USING (public.is_admin());

CREATE TRIGGER trg_qst_updated BEFORE UPDATE ON public.quality_syllabus_topics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_qqr_updated BEFORE UPDATE ON public.question_quality_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.system_settings (key, value, description) VALUES
 ('quality_mode', '"off"', 'Mock test quality gate: off | report | strict'),
 ('quality_wave', '0', 'Which quality wave is checked (0 = none)'),
 ('quality_auto_approve', 'false', 'Never auto-approve unless owner enables'),
 ('quality_daily_ai_cap', '300', 'Max free-key AI calls per day for the quality gate')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.quality_wave_tests (definition_id, wave, label)
SELECT jt.definition_id, 1, jt.title FROM public.job_tests jt
WHERE jt.definition_id IS NOT NULL AND (
  jt.title ILIKE 'IBA Karachi NTHP Mock Test 2027%' OR
  jt.title ILIKE 'Sukkur IBA Sindh Talent Hunt Program (STHP) 2027%' OR
  jt.title = 'Junior Office Associate (BPS-13)' OR
  jt.title = 'Assistant Accountant (BPS-15)' OR
  jt.title ILIKE 'Sindh Teaching License Exam - Elementary%' OR
  jt.title ILIKE 'Sindh Teaching License Exam - Secondary%' OR
  jt.title ILIKE 'Security Officer (BPS-17) - BPS-17 High Court of Sindh%' OR
  jt.title ILIKE 'Stenographer (BPS-16) - District & Sessions Court Jamshoro%' OR
  jt.title = 'Junior Clerk (BPS-11) - SIBA Testing Services (STS)' OR
  jt.title = 'Junior Clerk (BPS-11) - District & Sessions Court Jamshoro' OR
  jt.title = 'NTS GAT General Mock Test')
ON CONFLICT DO NOTHING;

INSERT INTO public.quality_syllabus_topics (definition_id, section, topic, source_tier, weight)
SELECT jt.definition_id, s->>'topic', s->>'topic',
  CASE WHEN jt.title ILIKE '%NTHP%' THEN 'A' ELSE 'C' END,
  NULLIF(s->>'percentage','')::numeric
FROM public.job_tests jt
JOIN public.quality_wave_tests w ON w.definition_id = jt.definition_id
CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(jt.syllabus)='array' THEN jt.syllabus ELSE '[]'::jsonb END) s
WHERE coalesce(s->>'topic','') <> ''
ON CONFLICT DO NOTHING;