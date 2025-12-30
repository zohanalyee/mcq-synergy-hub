import { supabase } from "@/integrations/supabase/client";
import { EducationalSystem, Level, SyllabusImportItem } from "@/types/lms.types";

// ============ Educational Systems ============

export const getEducationalSystems = async (): Promise<EducationalSystem[]> => {
  const { data, error } = await supabase
    .from('educational_systems')
    .select(`
      *,
      levels(count)
    `)
    .order('name');

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

export const getLevelsBySystem = async (systemId: string): Promise<Level[]> => {
  const { data, error } = await supabase
    .from('levels')
    .select(`
      *,
      subjects(count)
    `)
    .eq('system_id', systemId)
    .order('order_index');

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

// ============ Bulk Import ============

export const bulkImportSyllabus = async (
  levelId: string,
  syllabusData: SyllabusImportItem[]
): Promise<{ subjects: number; topics: number; errors: string[] }> => {
  const result = { subjects: 0, topics: 0, errors: [] as string[] };

  for (const item of syllabusData) {
    // Create subject
    const { data: subjectData, error: subjectError } = await supabase
      .from('subjects')
      .insert([{
        name: item.subject,
        description: `Subject: ${item.subject}`,
        level_id: levelId
      }])
      .select()
      .single();

    if (subjectError) {
      result.errors.push(`Failed to create subject "${item.subject}": ${subjectError.message}`);
      continue;
    }

    result.subjects++;

    // Create topics for this subject
    if (item.topics && item.topics.length > 0) {
      const topicsToInsert = item.topics.map(topicName => ({
        name: topicName,
        description: `Topic: ${topicName}`,
        subject_id: subjectData.id
      }));

      const { error: topicsError, data: topicsData } = await supabase
        .from('topics')
        .insert(topicsToInsert)
        .select();

      if (topicsError) {
        result.errors.push(`Failed to create topics for "${item.subject}": ${topicsError.message}`);
      } else {
        result.topics += topicsData?.length || 0;
      }
    }
  }

  return result;
};
