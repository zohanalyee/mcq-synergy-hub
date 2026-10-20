CREATE TABLE public.featured_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  badge text NOT NULL DEFAULT 'PRACTICE NOW',
  href text NOT NULL,
  deadline_date date,
  exam_slug text,
  closed_days integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  icon text,
  placements text NOT NULL DEFAULT 'both',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.featured_cards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.featured_cards TO authenticated;
GRANT ALL ON public.featured_cards TO service_role;
ALTER TABLE public.featured_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active featured cards" ON public.featured_cards FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins manage featured cards" ON public.featured_cards FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.validate_featured_card() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.badge NOT IN ('APPLY NOW','LIVE','CLOSING SOON','PRACTICE NOW','COMING SOON') THEN RAISE EXCEPTION 'Invalid badge'; END IF;
  IF NEW.placements NOT IN ('home','exams','both') THEN RAISE EXCEPTION 'Invalid placement'; END IF;
  IF NOT (NEW.href ~ '^/[^/]' OR NEW.href = '/' OR NEW.href ~ '^https://') THEN RAISE EXCEPTION 'Link must start with / or https://'; END IF;
  IF NEW.closed_days < 0 THEN NEW.closed_days := 0; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER featured_cards_validate BEFORE INSERT OR UPDATE ON public.featured_cards FOR EACH ROW EXECUTE FUNCTION public.validate_featured_card();
CREATE TRIGGER featured_cards_updated BEFORE UPDATE ON public.featured_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.featured_cards (title, subtitle, badge, href, exam_slug, sort_order, icon, placements) VALUES
('Sukkur IBA STHP 2027', 'Free practice PDF + full mock test. Apply before the deadline.', 'APPLY NOW', '/exams/sthp', 'sthp', 1, 'GraduationCap', 'both'),
('IBA Karachi NTHP (OGDC)', 'Free practice PDF and mock test for the NTHP round.', 'APPLY NOW', '/exams/nthp', 'nthp', 2, 'Building2', 'both'),
('IBA Community Colleges & Schools (STS)', 'Mock tests for all announced posts are ready. Get a WhatsApp alert for the next announcement.', 'PRACTICE NOW', '/exams/sts', NULL, 3, 'Timer', 'both');

INSERT INTO public.system_settings (key, value, description) VALUES ('featured_block_enabled', 'true'::jsonb, 'Show Featured Exams block on homepage and /exams')
ON CONFLICT (key) DO NOTHING;
CREATE POLICY "Public can read featured block switch" ON public.system_settings FOR SELECT USING (key = 'featured_block_enabled');