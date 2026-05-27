
-- Backfill topic_id from free-text subject/topic strings (mirrors backfill_topic_ids())
UPDATE public.content_items ci
SET topic_id = t.id
FROM public.topics t
JOIN public.subjects s ON t.subject_id = s.id
WHERE ci.topic_id IS NULL
  AND ci.category = 'mcq'
  AND ci.topic IS NOT NULL
  AND ci.subject IS NOT NULL
  AND (
    lower(trim(ci.topic)) = lower(trim(t.name))
    OR ci.topic ILIKE '%' || t.name || '%'
  )
  AND (
    lower(trim(ci.subject)) = lower(trim(s.name))
    OR ci.subject ILIKE '%' || s.name || '%'
  );

-- Backfill canonical_topic_name (slug) where missing — enables cross-board sharing
UPDATE public.content_items
SET canonical_topic_name = LOWER(REGEXP_REPLACE(trim(topic), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE canonical_topic_name IS NULL
  AND topic IS NOT NULL
  AND length(trim(topic)) > 0
  AND category = 'mcq';

-- Tag the 524 NULL-subject orphans for admin attention (no deletion)
UPDATE public.content_items
SET tags = array_append(COALESCE(tags, ARRAY[]::text[]), 'needs-subject-review')
WHERE subject IS NULL
  AND category = 'mcq'
  AND NOT ('needs-subject-review' = ANY(COALESCE(tags, ARRAY[]::text[])));
