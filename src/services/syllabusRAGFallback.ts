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
  difficulty?: string
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

  const { data: byName } = await queryByName;

  // Merge and deduplicate
  const seen = new Set<string>();
  const merged: SyllabusQuestion[] = [];

  for (const row of [...(byId || []), ...(byName || [])]) {
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

// Get MCQs with balanced distribution across topics + fallback info
export async function getQuestionsWithFallbackInfo(params: {
  topicIds: string[];
  requestedCount: number;
  difficulty?: string;
}): Promise<{
  questions: SyllabusQuestion[];
  hasEnough: boolean;
  shortage: number;
  ragAvailable: boolean;
  ragDocumentCount: number;
}> {
  const { topicIds, requestedCount, difficulty } = params;

  if (topicIds.length === 0) {
    return { questions: [], hasEnough: false, shortage: requestedCount, ragAvailable: false, ragDocumentCount: 0 };
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

  for (const topicId of topicIds) {
    const topicName = topicNameMap[topicId] || '';
    const topicQuestions = await fetchQuestionsForTopic(topicId, topicName, perTopicCount, difficulty);
    
    for (const q of topicQuestions) {
      if (!seen.has(q.id)) {
        seen.add(q.id);
        allQuestions.push(q);
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
    ragDocumentCount: ragInfo.documentCount
  };
}
