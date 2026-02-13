import { supabase } from "@/integrations/supabase/client";
import { EducationalSystem, Level, SyllabusImportItem } from "@/types/lms.types";

// ============ Educational Systems ============

export const getEducationalSystems = async (includeUnapproved = false): Promise<EducationalSystem[]> => {
  let query = supabase
    .from('educational_systems')
    .select(`
      *,
      levels(count)
    `)
    .order('name');

  if (!includeUnapproved) {
    query = query.or('approved.is.null,approved.eq.true');
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching educational systems:", error);
    return [];
  }

  return (data || []).map(system => ({
    id: system.id,
    name: system.name,
    type: system.type as 'academic' | 'job',
    description: system.description,
    is_active: system.is_active,
    created_at: system.created_at,
    levelCount: system.levels?.[0]?.count || 0
  }));
};

export const addEducationalSystem = async (
  system: Omit<EducationalSystem, 'id' | 'created_at' | 'levelCount'>
): Promise<EducationalSystem | null> => {
  const { data, error } = await supabase
    .from('educational_systems')
    .insert([{
      name: system.name,
      type: system.type,
      description: system.description,
      is_active: system.is_active
    }])
    .select()
    .single();

  if (error) {
    console.error("Error adding educational system:", error);
    return null;
  }

  return { ...data, type: data.type as 'academic' | 'job', levelCount: 0 };
};

export const updateEducationalSystem = async (
  id: string,
  updates: Partial<EducationalSystem>
): Promise<EducationalSystem | null> => {
  const { data, error } = await supabase
    .from('educational_systems')
    .update({
      name: updates.name,
      type: updates.type,
      description: updates.description,
      is_active: updates.is_active
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error("Error updating educational system:", error);
    return null;
  }

  return { ...data, type: data.type as 'academic' | 'job' };
};

export const removeEducationalSystem = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('educational_systems')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error removing educational system:", error);
    return false;
  }

  return true;
};

// ============ Levels ============

export const getLevelsBySystem = async (systemId: string, includeUnapproved = false): Promise<Level[]> => {
  let query = supabase
    .from('levels')
    .select(`
      *,
      subjects(count)
    `)
    .eq('system_id', systemId)
    .order('order_index');

  if (!includeUnapproved) {
    query = query.or('approved.is.null,approved.eq.true');
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching levels:", error);
    return [];
  }

  return (data || []).map(level => ({
    id: level.id,
    system_id: level.system_id,
    name: level.name,
    order_index: level.order_index,
    created_at: level.created_at,
    subjectCount: level.subjects?.[0]?.count || 0
  }));
};

export const addLevel = async (
  systemId: string,
  level: { name: string; order_index?: number }
): Promise<Level | null> => {
  const { data, error } = await supabase
    .from('levels')
    .insert([{
      system_id: systemId,
      name: level.name,
      order_index: level.order_index || 0
    }])
    .select()
    .single();

  if (error) {
    console.error("Error adding level:", error);
    return null;
  }

  return { ...data, subjectCount: 0 };
};

export const updateLevel = async (
  id: string,
  updates: Partial<Level>
): Promise<Level | null> => {
  const { data, error } = await supabase
    .from('levels')
    .update({
      name: updates.name,
      order_index: updates.order_index
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error("Error updating level:", error);
    return null;
  }

  return data;
};

export const removeLevel = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('levels')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error removing level:", error);
    return false;
  }

  return true;
};

// ============ Subjects for Level ============

export const getSubjectsByLevel = async (levelId: string) => {
  const { data, error } = await supabase
    .from('subjects')
    .select(`
      *,
      topics(count)
    `)
    .eq('level_id', levelId)
    .order('name');

  if (error) {
    console.error("Error fetching subjects for level:", error);
    return [];
  }

  return (data || []).map(subject => ({
    id: subject.id,
    name: subject.name,
    description: subject.description,
    icon: subject.icon,
    category: subject.category,
    level_id: subject.level_id,
    created_at: subject.created_at,
    topicCount: subject.topics?.[0]?.count || 0
  }));
};

export const assignSubjectToLevel = async (
  subjectId: string,
  levelId: string | null
): Promise<boolean> => {
  const { error } = await supabase
    .from('subjects')
    .update({ level_id: levelId })
    .eq('id', subjectId);

  if (error) {
    console.error("Error assigning subject to level:", error);
    return false;
  }

  return true;
};

// ============ Topics with RAG Status ============

export interface TopicWithRAGStatus {
  id: string;
  name: string;
  description: string | null;
  subject_id: string | null;
  created_at: string;
  documentCount: number;
  chunkCount: number;
  subjectName: string;
}

export const getTopicsWithRAGStatus = async (subjectId: string): Promise<TopicWithRAGStatus[]> => {
  // Fetch topics
  const { data: topics, error: topicsError } = await supabase
    .from('topics')
    .select('*')
    .eq('subject_id', subjectId)
    .order('name');

  if (topicsError) {
    console.error("Error fetching topics:", topicsError);
    return [];
  }

  if (!topics || topics.length === 0) return [];

  // Fetch subject name
  const { data: subject } = await supabase
    .from('subjects')
    .select('name')
    .eq('id', subjectId)
    .single();

  const subjectName = subject?.name || '';

  // Fetch document counts for all topics
  const topicIds = topics.map(t => t.id);
  const { data: documents, error: docsError } = await supabase
    .from('documents')
    .select('topic_id, id')
    .in('topic_id', topicIds)
    .eq('status', 'completed');

  if (docsError) {
    console.error("Error fetching documents:", docsError);
  }

  // Get document IDs with documents
  const documentsByTopic = new Map<string, string[]>();
  (documents || []).forEach(doc => {
    if (doc.topic_id) {
      const existing = documentsByTopic.get(doc.topic_id) || [];
      existing.push(doc.id);
      documentsByTopic.set(doc.topic_id, existing);
    }
  });

  // Fetch chunk counts for documents
  const allDocIds = (documents || []).map(d => d.id);
  let chunksByDocument = new Map<string, number>();
  
  if (allDocIds.length > 0) {
    const { data: sections } = await supabase
      .from('document_sections')
      .select('document_id')
      .in('document_id', allDocIds);

    (sections || []).forEach(s => {
      const count = chunksByDocument.get(s.document_id) || 0;
      chunksByDocument.set(s.document_id, count + 1);
    });
  }

  return topics.map(topic => {
    const docIds = documentsByTopic.get(topic.id) || [];
    const chunkCount = docIds.reduce((sum, docId) => sum + (chunksByDocument.get(docId) || 0), 0);
    
    return {
      id: topic.id,
      name: topic.name,
      description: topic.description,
      subject_id: topic.subject_id,
      created_at: topic.created_at,
      documentCount: docIds.length,
      chunkCount,
      subjectName
    };
  });
};

// ============ Bulk Import ============

export const bulkImportSyllabus = async (
  levelId: string,
  syllabusData: SyllabusImportItem[]
): Promise<{ subjects: number; topics: number; skippedSubjects: number; skippedTopics: number; errors: string[] }> => {
  const result = { 
    subjects: 0, 
    topics: 0, 
    skippedSubjects: 0,
    skippedTopics: 0,
    errors: [] as string[] 
  };

  for (const item of syllabusData) {
    let subjectId: string;
    
    // Step 1: Check if subject already exists in this level
    const { data: existingSubject } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', item.subject)
      .eq('level_id', levelId)
      .maybeSingle();

    if (existingSubject) {
      // Subject exists - use it
      subjectId = existingSubject.id;
      result.skippedSubjects++;
    } else {
      // Create new subject
      const { data: newSubject, error: subjectError } = await supabase
        .from('subjects')
        .insert([{
          name: item.subject,
          description: `Subject: ${item.subject}`,
          level_id: levelId
        }])
        .select('id')
        .single();

      if (subjectError) {
        result.errors.push(`Failed to create subject "${item.subject}": ${subjectError.message}`);
        continue;
      }
      
      subjectId = newSubject.id;
      result.subjects++;
    }

    // Step 2: Process topics for this subject
    if (item.topics && item.topics.length > 0) {
      for (const topicName of item.topics) {
        // Check if topic already exists
        const { data: existingTopic } = await supabase
          .from('topics')
          .select('id')
          .eq('name', topicName)
          .eq('subject_id', subjectId)
          .maybeSingle();

        if (existingTopic) {
          result.skippedTopics++;
          continue;
        }

        // Create new topic
        const { error: topicError } = await supabase
          .from('topics')
          .insert([{
            name: topicName,
            description: `Topic: ${topicName}`,
            subject_id: subjectId
          }]);

        if (topicError) {
          result.errors.push(`Failed to create topic "${topicName}": ${topicError.message}`);
        } else {
          result.topics++;
        }
      }
    }
  }

  return result;
};
