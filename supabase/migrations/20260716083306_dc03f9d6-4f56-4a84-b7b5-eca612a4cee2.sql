
-- Phase 3 (LINK-only): concept-group columns + indices. No deletes, no merges.
ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS concept_group_id UUID,
  ADD COLUMN IF NOT EXISTS concept_grouped_at TIMESTAMPTZ;

ALTER TABLE public.job_test_questions
  ADD COLUMN IF NOT EXISTS concept_group_id UUID,
  ADD COLUMN IF NOT EXISTS concept_grouped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS usage_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reused_from_content_item_id UUID;

CREATE INDEX IF NOT EXISTS content_items_concept_group_idx
  ON public.content_items (concept_group_id) WHERE concept_group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS job_test_questions_concept_group_idx
  ON public.job_test_questions (concept_group_id) WHERE concept_group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS job_test_questions_subject_reuse_idx
  ON public.job_test_questions (subject, usage_count, last_used_at);

CREATE INDEX IF NOT EXISTS content_items_reuse_pool_idx
  ON public.content_items (subject, category, status, usage_count, last_used_at)
  WHERE category = 'mcq' AND status = 'approved';
