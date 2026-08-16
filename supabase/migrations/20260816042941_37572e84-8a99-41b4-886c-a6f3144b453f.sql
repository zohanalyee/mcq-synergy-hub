-- 1. exam_tier columns (nullable; legacy rows stay usable)
ALTER TABLE public.job_test_definitions ADD COLUMN IF NOT EXISTS exam_tier text;
ALTER TABLE public.job_test_questions  ADD COLUMN IF NOT EXISTS exam_tier text;
ALTER TABLE public.content_items       ADD COLUMN IF NOT EXISTS exam_tier text;

-- 2. Backfill job_test_definitions from job_title / department (mirrors _shared/examTier.ts)
UPDATE public.job_test_definitions d
SET exam_tier = CASE
  WHEN concat_ws(' ', d.job_title, d.department) ~* '(\mcss\M|\mpms\M|\mpcs\M|central superior services|provincial management service)' THEN 'competitive'
  WHEN concat_ws(' ', d.job_title, d.department) ~* '(\mmdcat\M|\mecat\M|\mnust\M|entry test|admission test)' THEN 'entry_test'
  WHEN concat_ws(' ', d.job_title, d.department) ~* '(class\s*(9|10|11|12)|\m(9th|10th|11th|12th)\M|\m(matric|inter|intermediate|fsc|hssc|ssc)\M)' THEN 'academic'
  WHEN (regexp_match(concat_ws(' ', d.job_title, d.department), '\m(?:bps|bs)\s*[-–:]?\s*(\d{1,2})\M', 'i'))[1]::int >= 18 THEN 'competitive'
  WHEN (regexp_match(concat_ws(' ', d.job_title, d.department), '\m(?:bps|bs)\s*[-–:]?\s*(\d{1,2})\M', 'i'))[1]::int >= 15 THEN 'mid'
  WHEN (regexp_match(concat_ws(' ', d.job_title, d.department), '\m(?:bps|bs)\s*[-–:]?\s*(\d{1,2})\M', 'i'))[1]::int IS NOT NULL THEN 'clerical'
  WHEN concat_ws(' ', d.job_title, d.department) ~* '(sub[- ]inspector|assistant director|tehsildar|\m(ese|sse|set|jest|pst|sst)\M|lecturer|\mofficer\M|\msupervisor\M|\msuperintendent\M|\mauditor\M|\minspector\M)' THEN 'mid'
  ELSE 'clerical'
END
WHERE d.exam_tier IS NULL;

-- 3. Backfill job_test_questions from their parent test
UPDATE public.job_test_questions q
SET exam_tier = d.exam_tier
FROM public.job_tests t
JOIN public.job_test_definitions d ON d.id = t.definition_id
WHERE q.job_test_id = t.id AND q.exam_tier IS NULL AND d.exam_tier IS NOT NULL;

-- fallback: questions whose job_test_id points directly at a definition
UPDATE public.job_test_questions q
SET exam_tier = d.exam_tier
FROM public.job_test_definitions d
WHERE q.job_test_id = d.id AND q.exam_tier IS NULL AND d.exam_tier IS NOT NULL;

-- 4. Backfill content_items from exam_category
UPDATE public.content_items
SET exam_tier = CASE upper(trim(exam_category))
  WHEN 'CSS' THEN 'competitive'
  WHEN 'UNI_ENTRY' THEN 'entry_test'
  WHEN 'BOARDS' THEN 'academic'
  WHEN 'ASF' THEN 'clerical'
  WHEN 'FPSC' THEN 'mid'
  WHEN 'PPSC' THEN 'mid'
  ELSE NULL
END
WHERE exam_tier IS NULL AND exam_category IS NOT NULL;

-- 5. Indexes for tier-scoped reuse pools
CREATE INDEX IF NOT EXISTS idx_jtq_subject_tier_approved
  ON public.job_test_questions (subject, exam_tier, admin_approved);
CREATE INDEX IF NOT EXISTS idx_ci_subject_tier_status
  ON public.content_items (subject, exam_tier, status);

-- 6. One-time cleanup sweep: essay/long-stem items sitting in clerical or mid
--    tier mock tests go back to the review queue. Nothing is deleted.
UPDATE public.job_test_questions
SET admin_approved = false
WHERE admin_approved = true
  AND exam_tier IN ('clerical', 'mid')
  AND (
    length(question) > 180
    OR question ~* 'read the following (passage|paragraph|text|extract)'
    OR question ~* 'write (a|an|short|down) (essay|note|paragraph|letter|application|summary)'
    OR question ~* '\m(discuss|elaborate|describe in detail|explain in detail)\M'
    OR question ~* 'in your own words'
  );