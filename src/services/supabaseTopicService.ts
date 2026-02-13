import { supabase } from "@/integrations/supabase/client";

export interface Topic {
  id?: string;
  subject_id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface TopicsData {
  [subjectName: string]: Topic[];
}

// Get all topics from Supabase
export const getTopics = async (includeUnapproved = false): Promise<TopicsData> => {
  try {
    let query = supabase
      .from('topics')
      .select(`
        *,
        subjects!inner(name)
      `)
      .order('name');

    if (!includeUnapproved) {
      query = query.or('approved.is.null,approved.eq.true');
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching topics:", error);
      return {};
    }

    // Group topics by subject name
    const groupedTopics: TopicsData = {};
    
    (data || []).forEach(topic => {
      const subjectName = topic.subjects?.name;
      if (subjectName) {
        if (!groupedTopics[subjectName]) {
          groupedTopics[subjectName] = [];
        }
        groupedTopics[subjectName].push({
          id: topic.id,
          subject_id: topic.subject_id,
          name: topic.name,
          description: topic.description,
          created_at: topic.created_at
        });
      }
    });

    return groupedTopics;
  } catch (error) {
    console.error("Error loading topics:", error);
    return {};
  }
};

// Get topics for a specific subject
export const getTopicsBySubject = async (subjectId: string): Promise<Topic[]> => {
  try {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('subject_id', subjectId)
      .order('name');

    if (error) {
      console.error("Error fetching topics for subject:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error loading topics for subject:", error);
    return [];
  }
};

// Add a topic
export const addTopic = async (subjectId: string, topic: Omit<Topic, 'id' | 'subject_id' | 'created_at'>): Promise<Topic | null> => {
  try {
    // Check if topic already exists for this subject
    const { data: existing } = await supabase
      .from('topics')
      .select('id')
      .eq('subject_id', subjectId)
      .eq('name', topic.name)
      .single();

    if (existing) {
      console.error("Topic with this name already exists for this subject");
      return null;
    }

    const { data, error } = await supabase
      .from('topics')
      .insert([{
        subject_id: subjectId,
        name: topic.name,
        description: topic.description
      }])
      .select()
      .single();

    if (error) {
      console.error("Error adding topic:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error adding topic:", error);
    return null;
  }
};

// Remove a topic
export const removeTopic = async (topicId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', topicId);

    if (error) {
      console.error("Error removing topic:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error removing topic:", error);
    return false;
  }
};

// Find or create topic by name and subject
export const findOrCreateTopic = async (subjectId: string, topicName: string): Promise<Topic | null> => {
  try {
    // First try to find existing topic
    const { data: existing } = await supabase
      .from('topics')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('name', topicName)
      .single();

    if (existing) {
      return existing;
    }

    // Create new topic if not found
    return await addTopic(subjectId, {
      name: topicName,
      description: `Auto-created topic: ${topicName}`
    });
  } catch (error) {
    console.error("Error finding or creating topic:", error);
    return null;
  }
};

// Legacy function for backward compatibility
export const getTopicsBySubjectName = async (subjectName: string): Promise<Topic[]> => {
  try {
    const { data, error } = await supabase
      .from('topics')
      .select(`
        *,
        subjects!inner(name)
      `)
      .eq('subjects.name', subjectName)
      .order('name');

    if (error) {
      console.error("Error fetching topics for subject name:", error);
      return [];
    }

    return (data || []).map(topic => ({
      id: topic.id,
      subject_id: topic.subject_id,
      name: topic.name,
      description: topic.description,
      created_at: topic.created_at
    }));
  } catch (error) {
    console.error("Error loading topics for subject name:", error);
    return [];
  }
};