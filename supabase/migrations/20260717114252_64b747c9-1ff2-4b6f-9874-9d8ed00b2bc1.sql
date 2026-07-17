-- ============= Phase 4a: mastery cache table =============
CREATE TABLE IF NOT EXISTS public.user_question_mastery (
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id        UUID NOT NULL,
  question_source    TEXT NOT NULL CHECK (question_source IN ('content_items','job_test_questions')),
  subject            TEXT,
  concept_group_id   UUID,
  correct_count      INT  NOT NULL DEFAULT 0,
  incorrect_count    INT  NOT NULL DEFAULT 0,
  consecutive_correct INT NOT NULL DEFAULT 0,
  last_result        BOOLEAN,
  last_attempted_at  TIMESTAMPTZ,
  mastery_level      TEXT NOT NULL DEFAULT 'unseen'
    CHECK (mastery_level IN ('unseen','learning','review','mastered')),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);

GRANT SELECT ON public.user_question_mastery TO authenticated;
GRANT ALL    ON public.user_question_mastery TO service_role;

ALTER TABLE public.user_question_mastery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own mastery"
  ON public.user_question_mastery
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_mastery_user_level_idx
  ON public.user_question_mastery(user_id, mastery_level);
CREATE INDEX IF NOT EXISTS user_mastery_user_subject_idx
  ON public.user_question_mastery(user_id, subject);
CREATE INDEX IF NOT EXISTS user_mastery_user_group_idx
  ON public.user_question_mastery(user_id, concept_group_id)
  WHERE concept_group_id IS NOT NULL;

-- ============= Trigger: recompute mastery on each attempt =============
CREATE OR REPLACE FUNCTION public.sync_user_question_mastery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_qid          UUID;
  v_source       TEXT;
  v_subject      TEXT;
  v_group_id     UUID;
  v_prev_streak  INT := 0;
  v_new_streak   INT;
  v_correct_cnt  INT;
  v_incorrect_cnt INT;
  v_new_level    TEXT;
BEGIN
  -- Only track when we have a real UUID question id + a signed-in user.
  IF NEW.user_id IS NULL OR NEW.question_id IS NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    v_qid := NEW.question_id::UUID;
  EXCEPTION WHEN others THEN
    RETURN NEW; -- non-uuid ids (e.g. AI temp ids) are ignored
  END;

  -- Resolve source table + enrich metadata.
  SELECT 'content_items', ci.subject, ci.concept_group_id
    INTO v_source, v_subject, v_group_id
  FROM public.content_items ci WHERE ci.id = v_qid;

  IF v_source IS NULL THEN
    SELECT 'job_test_questions', jq.subject, jq.concept_group_id
      INTO v_source, v_subject, v_group_id
    FROM public.job_test_questions jq WHERE jq.id = v_qid;
  END IF;

  IF v_source IS NULL THEN
    RETURN NEW; -- unknown question, skip
  END IF;

  SELECT consecutive_correct, correct_count, incorrect_count
    INTO v_prev_streak, v_correct_cnt, v_incorrect_cnt
  FROM public.user_question_mastery
  WHERE user_id = NEW.user_id AND question_id = v_qid;

  v_correct_cnt   := COALESCE(v_correct_cnt, 0)   + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END;
  v_incorrect_cnt := COALESCE(v_incorrect_cnt, 0) + CASE WHEN NEW.is_correct THEN 0 ELSE 1 END;
  v_new_streak    := CASE WHEN NEW.is_correct THEN COALESCE(v_prev_streak, 0) + 1 ELSE 0 END;

  v_new_level := CASE
    WHEN v_new_streak >= 3 THEN 'mastered'
    WHEN NOT NEW.is_correct THEN 'learning'
    ELSE 'review'
  END;

  INSERT INTO public.user_question_mastery (
    user_id, question_id, question_source, subject, concept_group_id,
    correct_count, incorrect_count, consecutive_correct,
    last_result, last_attempted_at, mastery_level, updated_at
  ) VALUES (
    NEW.user_id, v_qid, v_source, v_subject, v_group_id,
    v_correct_cnt, v_incorrect_cnt, v_new_streak,
    NEW.is_correct, COALESCE(NEW.attempted_at, now()), v_new_level, now()
  )
  ON CONFLICT (user_id, question_id) DO UPDATE
    SET correct_count       = EXCLUDED.correct_count,
        incorrect_count     = EXCLUDED.incorrect_count,
        consecutive_correct = EXCLUDED.consecutive_correct,
        last_result         = EXCLUDED.last_result,
        last_attempted_at   = EXCLUDED.last_attempted_at,
        mastery_level       = EXCLUDED.mastery_level,
        subject             = COALESCE(EXCLUDED.subject, public.user_question_mastery.subject),
        concept_group_id    = COALESCE(EXCLUDED.concept_group_id, public.user_question_mastery.concept_group_id),
        updated_at          = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_user_question_mastery ON public.user_attempt_history;
CREATE TRIGGER trg_sync_user_question_mastery
AFTER INSERT ON public.user_attempt_history
FOR EACH ROW EXECUTE FUNCTION public.sync_user_question_mastery();

-- ============= RPC: batch fetch mastery for selection =============
CREATE OR REPLACE FUNCTION public.get_my_mastery_for_questions(p_question_ids UUID[])
RETURNS TABLE (
  question_id      UUID,
  mastery_level    TEXT,
  consecutive_correct INT,
  last_attempted_at TIMESTAMPTZ,
  concept_group_id UUID
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.question_id, m.mastery_level, m.consecutive_correct,
         m.last_attempted_at, m.concept_group_id
  FROM public.user_question_mastery m
  WHERE m.user_id = auth.uid()
    AND m.question_id = ANY(p_question_ids);
$$;

REVOKE ALL ON FUNCTION public.get_my_mastery_for_questions(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_mastery_for_questions(UUID[]) TO authenticated;