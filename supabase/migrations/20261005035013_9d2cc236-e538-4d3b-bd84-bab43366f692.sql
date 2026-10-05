CREATE TABLE public.exam_pages (
  slug text PRIMARY KEY,
  kind text NOT NULL DEFAULT 'admission',
  facts jsonb NOT NULL DEFAULT '{}'::jsonb,
  test_date date,
  verified_on date,
  status text NOT NULL DEFAULT 'published',
  include_in_sitemap boolean NOT NULL DEFAULT true,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.exam_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_pages TO authenticated;
GRANT ALL ON public.exam_pages TO service_role;
ALTER TABLE public.exam_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published exam pages are public" ON public.exam_pages FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_admin());
CREATE POLICY "Admins insert exam pages" ON public.exam_pages FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins update exam pages" ON public.exam_pages FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins delete exam pages" ON public.exam_pages FOR DELETE TO authenticated USING (public.is_admin());

CREATE TABLE public.exam_pages_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  old_row jsonb NOT NULL,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.exam_pages_history TO authenticated;
GRANT ALL ON public.exam_pages_history TO service_role;
ALTER TABLE public.exam_pages_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read exam page history" ON public.exam_pages_history FOR SELECT TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.snapshot_exam_page()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.exam_pages_history (slug, old_row, changed_by)
  VALUES (OLD.slug, to_jsonb(OLD), auth.uid());
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END $$;
CREATE TRIGGER exam_pages_snapshot BEFORE UPDATE ON public.exam_pages
FOR EACH ROW EXECUTE FUNCTION public.snapshot_exam_page();