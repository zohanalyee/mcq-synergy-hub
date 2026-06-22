import { supabase } from "@/integrations/supabase/client";

// Check if RAG documents exist for the given topic IDs
export async function checkRAGAvailability(topicIds: string[]): Promise<{
  hasDocuments: boolean;
  documentCount: number;
  topicsWithDocuments: string[];
}> {
  if (topicIds.length === 0) {
    return { hasDocuments: false, documentCount: 0, topicsWithDocuments: [] };
  }

  const { data, error } = await supabase
    .from('documents')
    .select('id, topic_id')
    .in('topic_id', topicIds)
    .eq('status', 'completed');

  if (error) {
    console.error('Error checking RAG availability:', error);
    return { hasDocuments: false, documentCount: 0, topicsWithDocuments: [] };
  }

  const uniqueTopics = [...new Set(data?.map(d => d.topic_id).filter(Boolean) || [])];
  
  return {
    hasDocuments: (data?.length || 0) > 0,
    documentCount: data?.length || 0,
    topicsWithDocuments: uniqueTopics as string[]
  };
}

// Generate MCQs from RAG for specific topics (admin-only)
export async function generateFromRAGForSyllabus(params: {
  topicIds: string[];
  count: number;
  difficulty?: string;
}): Promise<{
  success: boolean;
  generated: number;
  saved: number;
  error?: string;
}> {
  const { topicIds, count, difficulty = 'mixed' } = params;

  if (topicIds.length === 0) {
    return { success: false, generated: 0, saved: 0, error: 'No topics provided' };
  }

  const ragInfo = await checkRAGAvailability(topicIds);
   
  if (!ragInfo.hasDocuments) {
    return { 
      success: false, 
      generated: 0, 
      saved: 0, 
      error: 'No RAG documents found for any of the selected topics. Please upload documents first.' 
    };
  }

  const validTopicIds = topicIds.filter(id => ragInfo.topicsWithDocuments.includes(id));
   
  if (validTopicIds.length === 0) {
    return { 
      success: false, 
      generated: 0, 
      saved: 0, 
      error: 'No RAG documents found for selected topics.' 
    };
  }

  let totalGenerated = 0;
  let totalSaved = 0;
  const errors: string[] = [];

  const perTopicCount = Math.max(1, Math.ceil(count / validTopicIds.length));

  for (const topicId of validTopicIds) {
    try {
      const response = await supabase.functions.invoke('generate-from-rag', {
        body: {
          topic_id: topicId,
          difficulty: difficulty === 'mixed' ? undefined : difficulty,
          count: perTopicCount
        }
      });

      if (response.error) {
        errors.push(`Topic ${topicId}: ${response.error.message}`);
        continue;
      }

      const result = response.data;
       
      if (result?.error) {
        errors.push(`Topic ${topicId}: ${result.error}`);
        continue;
      }
       
      if (result?.success) {
        totalGenerated += result.questions_generated || 0;
        totalSaved += result.questions_saved || 0;
      }
    } catch (err) {
      console.error(`Error generating for topic ${topicId}:`, err);
      errors.push(`Topic ${topicId}: Generation failed`);
    }
  }

  return {
    success: totalSaved > 0 || errors.length === 0,
    generated: totalGenerated,
    saved: totalSaved,
    error: errors.length > 0 ? errors.join('; ') : undefined
  };
}

// Question bank item interface for syllabus builder
export interface SyllabusQuestion {
  id: string;
  title: string;
  options: any;
  correctOption: string | null;
  explanation: string | null;
  difficulty: string | null;
  subject: string | null;
  topic: string | null;
  topic_id: string | null;
}

// Fetch questions by topic_id (UUID) + topic name fallback, with balanced distribution
async function fetchQuestionsForTopic(
  topicId: string,
  topicName: string,
  count: number,
  difficulty?: string,
  excludeQuestionIds: string[] = []
): Promise<SyllabusQuestion[]> {
  // Query 1: By topic_id (linked questions)
  let queryById = supabase
    .from('content_items')
    .select('id, title, options, correct_option, explanation, difficulty, subject, topic, topic_id')
    .eq('category', 'mcq')
    .eq('status', 'approved')
    .eq('topic_id', topicId)
    .limit(count * 2);

  if (difficulty && difficulty !== 'mixed') {
    const titleCase = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
    queryById = queryById.eq('difficulty', titleCase);
  }

  if (excludeQuestionIds.length > 0) {
    queryById = queryById.not('id', 'in', `(${excludeQuestionIds.join(',')})`);
  }

  const { data: byId } = await queryById;

  // Query 2: By topic name for unlinked questions (topic_id is null)
  let queryByName = supabase
    .from('content_items')
    .select('id, title, options, correct_option, explanation, difficulty, subject, topic, topic_id')
    .eq('category', 'mcq')
    .eq('status', 'approved')
    .is('topic_id', null)
    .ilike('topic', topicName)
    .limit(count * 2);

  if (difficulty && difficulty !== 'mixed') {
    const titleCase = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
    queryByName = queryByName.eq('difficulty', titleCase);
  }

  if (excludeQuestionIds.length > 0) {
    queryByName = queryByName.not('id', 'in', `(${excludeQuestionIds.join(',')})`);
  }

  const { data: byName } = await queryByName;

  // Query 3: By canonical_topic_name for cross-board sharing
  const canonicalName = topicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let queryByCanonical = supabase
    .from('content_items')
    .select('id, title, options, correct_option, explanation, difficulty, subject, topic, topic_id')
    .eq('category', 'mcq')
    .eq('status', 'approved')
    .ilike('topic', canonicalName)
    .is('topic_id', null)
    .limit(count * 2);

  if (difficulty && difficulty !== 'mixed') {
    const titleCase = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
    queryByCanonical = queryByCanonical.eq('difficulty', titleCase);
  }

  if (excludeQuestionIds.length > 0) {
    queryByCanonical = queryByCanonical.not('id', 'in', `(${excludeQuestionIds.join(',')})`);
  }

  const { data: byCanonical } = await queryByCanonical;

  // Merge and deduplicate
  const seen = new Set<string>();
  const merged: SyllabusQuestion[] = [];

  for (const row of [...(byId || []), ...(byName || []), ...(byCanonical || [])]) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      merged.push({
        id: row.id,
        title: row.title,
        options: row.options,
        correctOption: row.correct_option,
        explanation: row.explanation,
        difficulty: row.difficulty,
        subject: row.subject,
        topic: row.topic,
        topic_id: row.topic_id
      });
    }
  }

  // Shuffle and take requested count
  const shuffled = merged.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Get topic question counts in bulk (for displaying availability badges)
export async function getTopicQuestionCounts(topicIds: string[]): Promise<Record<string, number>> {
  if (topicIds.length === 0) return {};

  // Get counts by topic_id
  const { data } = await supabase
    .from('content_items')
    .select('topic_id')
    .eq('category', 'mcq')
    .eq('status', 'approved')
    .in('topic_id', topicIds);

  const countMap: Record<string, number> = {};
  for (const item of data || []) {
    if (item.topic_id) {
      countMap[item.topic_id] = (countMap[item.topic_id] || 0) + 1;
    }
  }
  return countMap;
}

// GUEST-ONLY fetch path. Pulls approved questions via the SECURITY DEFINER
// `get_practice_questions` RPC (no correct answers / explanations), preserving
// the same fallback chain as the authenticated path:
//   1) by selected topic_id
//   2) retry without difficulty
//   3) by topic name
//   4) subject-wide fallback
// Correctness + explanations are resolved server-side at submission time.
async function getGuestQuestionsWithFallbackInfo(params: {
  topicIds: string[];
  requestedCount: number;
  difficulty?: string;
}): Promise<{
  questions: SyllabusQuestion[];
  hasEnough: boolean;
  shortage: number;
  ragAvailable: boolean;
  ragDocumentCount: number;
  usedDifficultyFallback: boolean;
  usedSubjectFallback: boolean;
}> {
  const { topicIds, requestedCount, difficulty } = params;

  const fetchLimit = Math.max(requestedCount * 3, 60);
  const seen = new Set<string>();
  const allQuestions: SyllabusQuestion[] = [];
  let usedDifficultyFallback = false;
  let usedSubjectFallback = false;

  const titleCaseDifficulty =
    difficulty && difficulty !== 'mixed'
      ? [difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase()]
      : undefined;

  const mapRow = (q: any): SyllabusQuestion => ({
    id: q.id,
    title: q.title,
    options: q.options,
    correctOption: null, // resolved server-side at submission
    explanation: null,   // resolved server-side at submission
    difficulty: q.difficulty,
    subject: q.subject,
    topic: q.topic,
    topic_id: q.topic_id ?? null,
  });

  const rpcFetch = async (args: Record<string, any>): Promise<any[]> => {
    const { data, error } = await supabase.rpc('get_practice_questions', {
      p_limit: fetchLimit,
      ...args,
    });
    if (error) {
      console.error('[guest syllabus] rpc error:', error.message);
      return [];
    }
    return (data || []) as any[];
  };

  const collect = (rows: any[]) => {
    for (const row of rows) {
      if (!row?.id || seen.has(row.id)) continue;
      seen.add(row.id);
      allQuestions.push(mapRow(row));
    }
  };

  // 1) Strict topic_id with difficulty filter
  collect(
    await rpcFetch({
      p_topic_ids: topicIds,
      ...(titleCaseDifficulty ? { p_difficulties: titleCaseDifficulty } : {}),
    }),
  );

  // 2) Retry without difficulty filter
  if (allQuestions.length < requestedCount && titleCaseDifficulty) {
    const before = allQuestions.length;
    collect(await rpcFetch({ p_topic_ids: topicIds }));
    if (allQuestions.length > before) usedDifficultyFallback = true;
  }

  // 3) By topic name
  if (allQuestions.length < requestedCount) {
    const { data: topics } = await supabase
      .from('topics')
      .select('id, name, subject_id')
      .in('id', topicIds);
    const topicNames = Array.from(
      new Set((topics || []).map((t: any) => t.name).filter(Boolean)),
    ) as string[];
    if (topicNames.length > 0) {
      collect(await rpcFetch({ p_topics: topicNames }));
    }

    // 4) Subject-wide fallback
    if (allQuestions.length === 0) {
      const subjectIds = Array.from(
        new Set((topics || []).map((t: any) => t.subject_id).filter(Boolean)),
      );
      if (subjectIds.length > 0) {
        const { data: subjects } = await supabase
          .from('subjects')
          .select('id, name')
          .in('id', subjectIds);
        const subjectNames = (subjects || []).map((s: any) => s.name).filter(Boolean);
        for (const subjectName of subjectNames) {
          collect(await rpcFetch({ p_subject_like: subjectName }));
        }
        if (allQuestions.length > 0) usedSubjectFallback = true;
      }
    }
  }

  // Shuffle and cap
  const shuffled = allQuestions.sort(() => Math.random() - 0.5);
  const finalQuestions = shuffled.slice(0, requestedCount);

  return {
    questions: finalQuestions,
    hasEnough: finalQuestions.length >= requestedCount,
    shortage: Math.max(0, requestedCount - finalQuestions.length),
    ragAvailable: false,
    ragDocumentCount: 0,
    usedDifficultyFallback,
    usedSubjectFallback,
  };
}


// Get MCQs with balanced distribution across topics + fallback info
export async function getQuestionsWithFallbackInfo(params: {
  topicIds: string[];
  requestedCount: number;
  difficulty?: string;
  userId?: string;
}): Promise<{
  questions: SyllabusQuestion[];
  hasEnough: boolean;
  shortage: number;
  ragAvailable: boolean;
  ragDocumentCount: number;
  usedDifficultyFallback: boolean;
  usedSubjectFallback: boolean;
}> {
  const { topicIds, requestedCount, difficulty, userId } = params;

  if (topicIds.length === 0) {
    return { questions: [], hasEnough: false, shortage: requestedCount, ragAvailable: false, ragDocumentCount: 0, usedDifficultyFallback: false, usedSubjectFallback: false };
  }

  // GUEST PATH: anonymous users must read approved questions through the
  // SECURITY DEFINER `get_practice_questions` RPC, which omits correct answers
  // and explanations so the answer key is never exposed via the public API.
  // Correctness is resolved server-side at submission time.
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session?.user) {
    return await getGuestQuestionsWithFallbackInfo({ topicIds, requestedCount, difficulty });
  }

  // Fetch attempted question IDs if userId provided
  let excludeQuestionIds: string[] = [];
  if (userId) {
    const { data: attempts } = await supabase
      .from('user_question_attempts' as any)
      .select('question_id')
      .eq('user_id', userId);

    excludeQuestionIds = (attempts as any[] || []).map((a: any) => a.question_id);
    if (excludeQuestionIds.length > 0) {
      console.log(`Excluding ${excludeQuestionIds.length} previously attempted questions`);
    }
  }

  // Get topic names for fallback query
  const { data: topics } = await supabase
    .from('topics')
    .select('id, name')
    .in('id', topicIds);

  const topicNameMap: Record<string, string> = {};
  for (const t of topics || []) {
    topicNameMap[t.id] = t.name;
  }

  // Distribute requested count across topics
  const perTopicCount = Math.max(1, Math.ceil(requestedCount / topicIds.length));
  const allQuestions: SyllabusQuestion[] = [];
  const seen = new Set<string>();

  let usedDifficultyFallback = false;

  for (const topicId of topicIds) {
    const topicName = topicNameMap[topicId] || '';
    let topicQuestions = await fetchQuestionsForTopic(topicId, topicName, perTopicCount, difficulty, excludeQuestionIds);
    
    // If no questions found with specific difficulty, retry without filter
    if (topicQuestions.length === 0 && difficulty && difficulty !== 'mixed') {
      topicQuestions = await fetchQuestionsForTopic(topicId, topicName, perTopicCount, undefined, excludeQuestionIds);
      if (topicQuestions.length > 0) {
        usedDifficultyFallback = true;
      }
    }

    for (const q of topicQuestions) {
      if (!seen.has(q.id)) {
        seen.add(q.id);
        allQuestions.push(q);
      }
    }
  }

  // Priority 3: Subject-wide fallback if no topic-specific questions found
  let usedSubjectFallback = false;
  if (allQuestions.length === 0) {
    console.log('No topic-specific questions found, trying subject-wide fallback...');
    const { data: topicSubjects } = await supabase
      .from('topics')
      .select('subject_id')
      .in('id', topicIds);

    const subjectIds = [...new Set(topicSubjects?.map(t => t.subject_id).filter(Boolean) || [])];

    if (subjectIds.length > 0) {
      const { data: subjects } = await supabase
        .from('subjects')
        .select('id, name')
        .in('id', subjectIds);

      const subjectNames = subjects?.map(s => s.name) || [];

      for (const subjectName of subjectNames) {
        const { data } = await supabase
          .from('content_items')
          .select('id, title, options, correct_option, explanation, difficulty, subject, topic, topic_id')
          .eq('category', 'mcq')
          .eq('status', 'approved')
          .ilike('subject', subjectName)
          .limit(requestedCount);

        for (const row of data || []) {
          if (!seen.has(row.id)) {
            seen.add(row.id);
            allQuestions.push({
              id: row.id,
              title: row.title,
              options: row.options,
              correctOption: row.correct_option,
              explanation: row.explanation,
              difficulty: row.difficulty,
              subject: row.subject,
              topic: row.topic,
              topic_id: row.topic_id
            });
          }
        }
      }

      if (allQuestions.length > 0) {
        usedSubjectFallback = true;
        console.log(`Subject fallback found ${allQuestions.length} questions`);
      }
    }
  }

  // Shuffle and cap at requested count
  const shuffled = allQuestions.sort(() => Math.random() - 0.5);
  const finalQuestions = shuffled.slice(0, requestedCount);

  // Check RAG availability
  const ragInfo = await checkRAGAvailability(topicIds);

  return {
    questions: finalQuestions,
    hasEnough: finalQuestions.length >= requestedCount,
    shortage: Math.max(0, requestedCount - finalQuestions.length),
    ragAvailable: ragInfo.hasDocuments,
    ragDocumentCount: ragInfo.documentCount,
    usedDifficultyFallback,
    usedSubjectFallback
  };
}
