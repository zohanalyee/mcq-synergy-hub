INSERT INTO public.exam_pages (slug, kind, facts, test_date, verified_on, include_in_sitemap, status)
VALUES ('sthp','admission', jsonb_build_object(
  'applyBy','29 October 2026',
  'testDate','8 November 2026',
  'officialUrl','https://www.iba-suk.edu.pk/admissions/announcements',
  'applyUrl','https://applyadmission.iba-suk.edu.pk',
  'verifiedOn','15 October 2026',
  'eligibility', jsonb_build_array(
    'Sindh domicile is required.',
    'Intermediate or equivalent passed in 2024, 2025 or 2026.',
    'Application fee, test centres, minimum marks percentage, negative marking and passing marks: check the official announcement.'),
  'keyDates', jsonb_build_array(
    jsonb_build_object('event','Last date to apply','value','29 October 2026'),
    jsonb_build_object('event','Admission test','value','8 November 2026'),
    jsonb_build_object('event','Application fee','value','Check the official announcement'),
    jsonb_build_object('event','Test centres','value','Check the official announcement'))
), '2026-11-08', '2026-10-15', true, 'published')
ON CONFLICT (slug) DO NOTHING;