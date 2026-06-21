/**
 * Server-side practice scoring + answer-free question delivery helpers.
 *
 * Correct answers and explanations for the MCQ bank (`content_items`) and
 * job-test bank (`job_test_questions`) are NEVER shipped to the browser at
 * load time. Questions are fetched answer-free; correctness, the correct
 * answer and the explanation are only revealed AFTER the user submits an
 * answer, via these SECURITY DEFINER RPCs (callable by guests + users).
 */

import { supabase } from "@/integrations/supabase/client";

export interface ScoredAnswer {
  id: string;
  correct_option: string | null;
  correct_answer: string | null;
  explanation: string | null;
  is_correct: boolean;
}

export interface SubmittedAnswer {
  id: string;
  answer: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isDbQuestionId = (id: any): id is string =>
  typeof id === "string" && UUID_RE.test(id);

/**
 * Score a batch of answers server-side. Tries the MCQ bank first, then the
 * job-test bank for any ids not found there, so callers don't need to know
 * which table a question came from. Returns a map of id -> ScoredAnswer.
 */
export const scorePracticeAnswers = async (
  submitted: SubmittedAnswer[],
): Promise<Record<string, ScoredAnswer>> => {
  const out: Record<string, ScoredAnswer> = {};
  const valid = (submitted || []).filter((s) => isDbQuestionId(s.id));
  if (valid.length === 0) return out;

  const payload = valid.map((s) => ({ id: s.id, answer: s.answer ?? "" }));

  try {
    const { data, error } = await supabase.rpc("score_practice_answers", {
      p_answers: payload as any,
    });
    if (error) console.warn("[scoring] content scoring error:", error.message);
    for (const row of (data || []) as ScoredAnswer[]) out[row.id] = row;
  } catch (e) {
    console.warn("[scoring] content scoring failed:", e);
  }

  // Any ids not resolved by the MCQ bank → try the job-test bank.
  const remaining = payload.filter((p) => !out[p.id]);
  if (remaining.length > 0) {
    try {
      const { data, error } = await supabase.rpc("score_job_practice_answers", {
        p_answers: remaining as any,
      });
      if (error) console.warn("[scoring] job scoring error:", error.message);
      for (const row of (data || []) as ScoredAnswer[]) out[row.id] = row;
    } catch (e) {
      console.warn("[scoring] job scoring failed:", e);
    }
  }

  return out;
};

/**
 * Merge server-scored correct answers/explanations back into question objects
 * so the existing client-side result UI (which reads `answer`/`explanation`)
 * keeps working unchanged.
 */
export const mergeScoredIntoQuestions = (
  questions: any[],
  scored: Record<string, ScoredAnswer>,
): any[] =>
  questions.map((q) => {
    const s = q?.id ? scored[q.id] : undefined;
    if (!s) return q;
    return {
      ...q,
      answer: s.correct_answer ?? q.answer,
      correct_option: s.correct_option ?? q.correct_option,
      correctOption: s.correct_option ?? q.correctOption,
      explanation: s.explanation ?? q.explanation,
    };
  });
