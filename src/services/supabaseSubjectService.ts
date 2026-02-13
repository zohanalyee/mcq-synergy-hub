import { supabase } from "@/integrations/supabase/client";

export interface Subject {
  id?: string;
  name: string;
  description?: string;
  icon?: string;
  category?: string;
  created_at?: string;
  topicCount?: number;
}

// Get all subjects from Supabase
export const getSubjects = async (includeUnapproved = false): Promise<Subject[]> => {
  try {
    let query = supabase
      .from('subjects')
      .select(`
        *,
        topics(count)
      `)
      .order('name');

    if (!includeUnapproved) {
      query = query.or('approved.is.null,approved.eq.true');
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching subjects:", error);
      return [];
    }

    return (data || []).map(subject => ({
      id: subject.id,
      name: subject.name,
      description: subject.description,
      icon: subject.icon,
      category: subject.category,
      created_at: subject.created_at,
      topicCount: subject.topics?.[0]?.count || 0
    }));
  } catch (error) {
    console.error("Error loading subjects:", error);
    return [];
  }
};

// Add a new subject
export const addSubject = async (subject: Omit<Subject, 'id' | 'created_at' | 'topicCount'>): Promise<Subject | null> => {
  try {
    // Check if subject already exists
    const { data: existing } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', subject.name)
      .single();

    if (existing) {
      console.error("Subject with this name already exists");
      return null;
    }

    const { data, error } = await supabase
      .from('subjects')
      .insert([{
        name: subject.name,
        description: subject.description,
        icon: subject.icon,
        category: subject.category
      }])
      .select()
      .single();

    if (error) {
      console.error("Error adding subject:", error);
      return null;
    }

    return {
      ...data,
      topicCount: 0
    };
  } catch (error) {
    console.error("Error adding subject:", error);
    return null;
  }
};

// Update a subject
export const updateSubject = async (id: string, updates: Partial<Subject>): Promise<Subject | null> => {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .update({
        name: updates.name,
        description: updates.description,
        icon: updates.icon,
        category: updates.category
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating subject:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error updating subject:", error);
    return null;
  }
};

// Remove a subject
export const removeSubject = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error removing subject:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error removing subject:", error);
    return false;
  }
};

// Find or create subject by name
export const findOrCreateSubject = async (name: string, category?: string): Promise<Subject | null> => {
  try {
    // First try to find existing subject
    const { data: existing } = await supabase
      .from('subjects')
      .select('*')
      .eq('name', name)
      .single();

    if (existing) {
      return existing;
    }

    // Create new subject if not found
    return await addSubject({
      name,
      description: `Auto-created subject: ${name}`,
      category: category || 'general'
    });
  } catch (error) {
    console.error("Error finding or creating subject:", error);
    return null;
  }
};