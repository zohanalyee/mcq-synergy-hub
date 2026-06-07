-- 1. New columns
ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS exam_category text,
  ADD COLUMN IF NOT EXISTS quality_grade text;

-- 2. Back-fill exam_category for all approved MCQs (keyword heuristic, academic default = BOARDS)
WITH src AS (
  SELECT id,
    lower(coalesce(subject,'') || ' ' || coalesce(topic,'') || ' ' || coalesce(canonical_topic_name,'') || ' ' || coalesce(title,'') || ' ' || coalesce(array_to_string(tags,' '),'')) AS blob
  FROM public.content_items
  WHERE category = 'mcq'
)
UPDATE public.content_items ci
SET exam_category = CASE
    WHEN src.blob ~ '\mmdcat\M' THEN 'MDCAT'
    WHEN src.blob ~ '\mecat\M' THEN 'ECAT'
    WHEN src.blob ~ '\mpms\M' THEN 'PMS'
    WHEN src.blob ~ '\mcss\M' THEN 'CSS'
    WHEN src.blob ~ '\mppsc\M' THEN 'PPSC'
    WHEN src.blob ~ '\mfpsc\M' THEN 'FPSC'
    WHEN src.blob ~ '\mspsc\M' THEN 'SPSC'
    WHEN src.blob ~ '\msts\M' THEN 'STS'
    WHEN src.blob ~ '\mnts\M' THEN 'NTS'
    WHEN src.blob ~ '\mfia\M' THEN 'FIA'
    WHEN src.blob ~ '\masf\M' THEN 'ASF'
    WHEN src.blob ~ '\m(nust|net|ecat|entry test|university|nums|comsats)\M' THEN 'UNI_ENTRY'
    WHEN src.blob ~ '\m(class|9th|10th|11th|12th|matric|fsc|f\.sc|board|grade)\M' THEN 'BOARDS'
    ELSE 'BOARDS'
  END
FROM src
WHERE ci.id = src.id;

-- 3. Back-fill quality_grade for all MCQs (never deletes; grade gates reuse)
UPDATE public.content_items ci
SET quality_grade = CASE
    -- F: structurally broken (not 4 options, or correct answer missing / not among options)
    WHEN NOT (jsonb_typeof(options) = 'array' AND jsonb_array_length(options) = 4)
         OR correct_option IS NULL OR length(trim(correct_option)) = 0
         OR NOT (options ? correct_option)
      THEN 'F'
    -- A: complete & trustworthy
    WHEN topic_id IS NOT NULL
         AND explanation IS NOT NULL AND length(trim(explanation)) > 0
         AND subject IS NOT NULL AND length(trim(subject)) > 0
         AND difficulty IS NOT NULL
      THEN 'A'
    -- B: has linkage + explanation but missing subject/difficulty metadata
    WHEN topic_id IS NOT NULL
         AND explanation IS NOT NULL AND length(trim(explanation)) > 0
      THEN 'B'
    -- D: orphaned (no topic link AND no explanation) - excluded from reuse
    WHEN topic_id IS NULL
         AND (explanation IS NULL OR length(trim(explanation)) = 0)
      THEN 'D'
    -- C: valid but missing either topic link or explanation - low priority
    ELSE 'C'
  END
WHERE category = 'mcq';

-- 4. Indexes for fast reuse-pool filtering
CREATE INDEX IF NOT EXISTS idx_content_items_exam_category ON public.content_items (exam_category) WHERE category = 'mcq';
CREATE INDEX IF NOT EXISTS idx_content_items_quality_grade ON public.content_items (quality_grade) WHERE category = 'mcq';