import { supabase } from "@/integrations/supabase/client";
import { getQuestionBank, QuestionBankItem } from "./questionBankService";

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

   // Only process topics that have RAG documents
   const ragInfo = await checkRAGAvailability(topicIds);
   
   if (!ragInfo.hasDocuments) {
     return { 
       success: false, 
       generated: 0, 
       saved: 0, 
       error: 'No RAG documents found for any of the selected topics. Please upload documents first.' 
     };
   }
 
   // Filter to only topics with documents
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

   // Distribute count across valid topics
   const perTopicCount = Math.max(1, Math.ceil(count / validTopicIds.length));

   for (const topicId of validTopicIds) {
    try {
       // generate-from-rag now accepts topic_id and resolves everything internally
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

// Get MCQs from DB with fallback info
export async function getQuestionsWithFallbackInfo(params: {
  topicIds: string[];
  requestedCount: number;
  difficulty?: string;
}): Promise<{
  questions: QuestionBankItem[];
  hasEnough: boolean;
  shortage: number;
  ragAvailable: boolean;
  ragDocumentCount: number;
}> {
  const { topicIds, requestedCount, difficulty } = params;

  // Get topic names for the query
  const { data: topics } = await supabase
    .from('topics')
    .select('id, name, subjects!inner(name)')
    .in('id', topicIds);

  const topicNames = topics?.map(t => t.name) || [];
  const subjectNames = [...new Set(
    topics?.map(t => {
      const subjectData = Array.isArray(t.subjects) ? t.subjects[0] : t.subjects;
      return subjectData?.name;
    }).filter(Boolean) || []
  )];

  // Query existing MCQs
  const filters: any = {
    subjects: subjectNames.length > 0 ? subjectNames : undefined,
    topics: topicNames.length > 0 ? topicNames : undefined,
    limit: requestedCount * 2 // Get extra for filtering
  };

  if (difficulty && difficulty !== 'mixed') {
    const difficultyMap: Record<string, string[]> = {
       'easy': ['Easy', 'easy'],
       'medium': ['Medium', 'medium'],
       'hard': ['Hard', 'hard']
    };
    filters.difficulties = difficultyMap[difficulty];
  }

  const questions = await getQuestionBank(filters);

  // Check RAG availability
  const ragInfo = await checkRAGAvailability(topicIds);

  const hasEnough = questions.length >= requestedCount;
  const shortage = Math.max(0, requestedCount - questions.length);

  return {
    questions: questions.slice(0, requestedCount),
    hasEnough,
    shortage,
    ragAvailable: ragInfo.hasDocuments,
    ragDocumentCount: ragInfo.documentCount
  };
}
