/**
 * Guest question loader — DB-only.
 *
 * Pulls approved bank questions from `content_items` for guest users.
 * Never calls the AI edge function. Validates only that a row has a
 * question text + options object so empty/broken rows don't break the
 * UI. Does NOT enforce a parsable correct answer (TestSession /
 * QuizPlayer normalize this downstream).
 */

import { supabase } from '@/integrations/supabase/client';

interface LoadParams {
  subjectId?: string;
  subjectName?: string;
  topicId?: string;
  topicIds?: string[];
  questionCount: number;
}

interface LoadResult {
  rows: any[];
  questions: any[];
}

const BASE_SELECT =
  'id, title, options, correct_option, explanation, subject, topic, topic_id, difficulty';

const normalizeOptions = (options: any): any[] => {
  if (!options) return [];
  if (typeof options === 'string') {
    try {
      const parsed = JSON.parse(options);
      return Array.isArray(parsed) ? parsed : Object.values(parsed || {});
    } catch {
      return [];
    }
  }
  if (!Array.isArray(options) && typeof options === 'object') {
    return Object.values(options);
  }
  return Array.isArray(options) ? options : [];
};

const dedupePush = (
  out: any[],
  seen: Set<string>,
  rows: any[] | null | undefined,
) => {
  if (!rows) return;
  for (const r of rows) {
    if (!r?.id || seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
  }
};

const validate = (q: any) => {
  const opts = normalizeOptions(q?.options);
  return q && (q.question || q.title) && opts.length >= 2;
};

const shuffle = <T,>(arr: T[]): T[] => {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export const loadGuestQuestions = async (
  params: LoadParams,
): Promise<LoadResult> => {
  const fetchLimit = Math.max(params.questionCount * 3, 60);

  const out: any[] = [];
  const seen = new Set<string>();

  // 1) Strict topic_id (single)
  if (params.topicId) {
    const { data, error } = await supabase
      .from('content_items')
      .select(BASE_SELECT)
      .eq('status', 'approved')
      .eq('topic_id', params.topicId)
      .not('title', 'is', null)
      .limit(fetchLimit);
    if (error) console.error('[guestQuestions] topic_id error:', error);
    dedupePush(out, seen, data);
  }

  // 2) topic_id IN (...)
  if (
    out.length < fetchLimit &&
    params.topicIds &&
    params.topicIds.length > 0
  ) {
    const { data, error } = await supabase
      .from('content_items')
      .select(BASE_SELECT)
      .eq('status', 'approved')
      .in('topic_id', params.topicIds)
      .not('title', 'is', null)
      .limit(fetchLimit);
    if (error) console.error('[guestQuestions] topic_ids error:', error);
    dedupePush(out, seen, data);
  }

  // 3) All topics under subject_id
  if (out.length < fetchLimit && params.subjectId) {
    const { data: topicRows, error: topicErr } = await supabase
      .from('topics')
      .select('id, name')
      .eq('subject_id', params.subjectId);
    if (topicErr) console.error('[guestQuestions] topics lookup error:', topicErr);

    const ids = (topicRows || []).map((t: any) => t.id).filter(Boolean);
    const canonicalNames: string[] = [];
    const topicNames = Array.from(
      new Set(
        (topicRows || [])
          .map((t: any) => t.name)
          .filter((v: any) => typeof v === 'string' && v.length > 0),
      ),
    );

    if (ids.length > 0) {
      const { data, error } = await supabase
        .from('content_items')
        .select(BASE_SELECT)
        .eq('status', 'approved')
        .in('topic_id', ids)
        .not('title', 'is', null)
        .limit(fetchLimit);
      if (error) console.error('[guestQuestions] subj.topic_id error:', error);
      dedupePush(out, seen, data);
    }

    if (out.length < fetchLimit && canonicalNames.length > 0) {
      const { data, error } = await supabase
        .from('content_items')
        .select(BASE_SELECT)
        .eq('status', 'approved')
        .in('canonical_topic_name', canonicalNames as string[])
        .not('title', 'is', null)
        .limit(fetchLimit);
      if (error) console.error('[guestQuestions] canonical error:', error);
      dedupePush(out, seen, data);
    }

    if (out.length < fetchLimit && topicNames.length > 0) {
      const { data, error } = await supabase
        .from('content_items')
        .select(BASE_SELECT)
        .eq('status', 'approved')
        .in('topic', topicNames as string[])
        .not('title', 'is', null)
        .limit(fetchLimit);
      if (error) console.error('[guestQuestions] topic-name error:', error);
      dedupePush(out, seen, data);
    }
  }

  // 4) Subject name fallback
  if (out.length < fetchLimit && params.subjectName) {
    const { data, error } = await supabase
      .from('content_items')
      .select(BASE_SELECT)
      .eq('status', 'approved')
      .ilike('subject', params.subjectName)
      .not('title', 'is', null)
      .limit(fetchLimit);
    if (error) console.error('[guestQuestions] subject ilike error:', error);
    dedupePush(out, seen, data);
  }

  const valid = out
    .map((q) => ({
      ...q,
      question: q.question || q.title,
      options: normalizeOptions(q.options),
    }))
    .filter(validate);
  const questions = shuffle(valid).slice(0, params.questionCount);

  console.log('GUEST FLOW DEBUG:', {
    totalRows: out.length,
    afterValidation: valid.length,
    sample: out[0],
  });

  return { rows: out, questions };
};
