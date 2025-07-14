
import { supabase } from "@/integrations/supabase/client";
import { ContentItem, ContentSubmission, ContentCategory, ContentStatus } from "@/interfaces/content";
import { UserRole } from "@/contexts/UserRoleContext";

// Helper function to transform database row to ContentItem
const transformContentItem = (row: any): ContentItem => {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category as ContentCategory,
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status as ContentStatus,
    createdBy: row.created_by,
    imageUrl: row.image_url,
    fileUrl: row.file_url,
    deadline: row.deadline,
    department: row.department,
    governmentLevel: row.government_level,
    cadre: row.cadre,
    scholarshipType: row.scholarship_type,
    institution: row.institution,
    examType: row.exam_type,
    examYear: row.exam_year,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    metaKeywords: row.meta_keywords,
    subject: row.subject,
    topic: row.topic,
    difficulty: row.difficulty,
    explanation: row.explanation,
    options: row.options,
    correctOption: row.correct_option,
    timeLimit: row.time_limit,
    marks: row.marks,
    questions: row.questions || [],
    showInSubjects: row.show_in_subjects,
    showInSyllabus: row.show_in_syllabus,
    showInMockTests: row.show_in_mock_tests,
  };
};

// Helper function to transform ContentItem to database row
const transformToDbRow = (item: Partial<ContentItem>) => {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    category: item.category,
    tags: item.tags,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
    status: item.status,
    created_by: item.createdBy,
    image_url: item.imageUrl,
    file_url: item.fileUrl,
    deadline: item.deadline,
    department: item.department,
    government_level: item.governmentLevel,
    cadre: item.cadre,
    scholarship_type: item.scholarshipType,
    institution: item.institution,
    exam_type: item.examType,
    exam_year: item.examYear,
    meta_title: item.metaTitle,
    meta_description: item.metaDescription,
    meta_keywords: item.metaKeywords,
    subject: item.subject,
    topic: item.topic,
    difficulty: item.difficulty,
    explanation: item.explanation,
    options: item.options as any,
    correct_option: item.correctOption,
    time_limit: item.timeLimit,
    marks: item.marks,
    questions: item.questions as any,
    show_in_subjects: item.showInSubjects,
    show_in_syllabus: item.showInSyllabus,
    show_in_mock_tests: item.showInMockTests,
  };
};

export const getAllContent = async (): Promise<ContentItem[]> => {
  try {
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching content:', error);
      throw error;
    }

    return data ? data.map(transformContentItem) : [];
  } catch (error) {
    console.error('Error in getAllContent:', error);
    return [];
  }
};

export const getContentByCategory = async (category: string): Promise<ContentItem[]> => {
  try {
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('category', category)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching content by category:', error);
      throw error;
    }

    return data ? data.map(transformContentItem) : [];
  } catch (error) {
    console.error('Error in getContentByCategory:', error);
    return [];
  }
};

export const getContentBySubjectAndTopic = async (subject?: string, topic?: string): Promise<ContentItem[]> => {
  try {
    let query = supabase
      .from('content_items')
      .select('*')
      .eq('status', 'approved');

    if (subject) {
      query = query.eq('subject', subject);
    }
    if (topic) {
      query = query.eq('topic', topic);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching content by subject/topic:', error);
      throw error;
    }

    return data ? data.map(transformContentItem) : [];
  } catch (error) {
    console.error('Error in getContentBySubjectAndTopic:', error);
    return [];
  }
};

export const submitContent = async (submission: ContentSubmission, userRole?: UserRole): Promise<ContentItem | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const contentData = transformToDbRow({
      ...submission,
      status: 'pending' as ContentStatus,
      createdBy: user?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const { data, error } = await supabase
      .from('content_items')
      .insert([contentData])
      .select()
      .single();

    if (error) {
      console.error('Error submitting content:', error);
      throw error;
    }

    return data ? transformContentItem(data) : null;
  } catch (error) {
    console.error('Error in submitContent:', error);
    throw error;
  }
};

export const updateContentStatus = async (id: string, status: ContentStatus, updatedData?: Partial<ContentItem>): Promise<ContentItem | null> => {
  try {
    const updatePayload = {
      status,
      updated_at: new Date().toISOString(),
      ...(updatedData ? transformToDbRow(updatedData) : {})
    };

    const { data, error } = await supabase
      .from('content_items')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating content status:', error);
      throw error;
    }

    return data ? transformContentItem(data) : null;
  } catch (error) {
    console.error('Error in updateContentStatus:', error);
    return null;
  }
};

export const deleteContent = async (id: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('content_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting content:', error);
      
      // Check for specific RLS policy violations
      if (error.message.includes('row-level security')) {
        return { success: false, error: 'You do not have permission to delete this content.' };
      }
      
      return { success: false, error: error.message || 'Failed to delete content' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteContent:', error);
    return { success: false, error: 'An unexpected error occurred while deleting content.' };
  }
};

export const getSubjectsAndTopics = async (): Promise<{ subjects: string[]; topics: Record<string, string[]> }> => {
  try {
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('name');

    if (subjectsError) {
      console.error('Error fetching subjects:', subjectsError);
      return { subjects: [], topics: {} };
    }

    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('name, subjects(name)');

    if (topicsError) {
      console.error('Error fetching topics:', topicsError);
      return { subjects: subjects?.map(s => s.name) || [], topics: {} };
    }

    const subjectNames = subjects?.map(s => s.name) || [];
    const topicsRecord: Record<string, string[]> = {};

    topics?.forEach((topic: any) => {
      const subjectName = topic.subjects?.name;
      if (subjectName) {
        if (!topicsRecord[subjectName]) {
          topicsRecord[subjectName] = [];
        }
        topicsRecord[subjectName].push(topic.name);
      }
    });

    return { subjects: subjectNames, topics: topicsRecord };
  } catch (error) {
    console.error('Error in getSubjectsAndTopics:', error);
    return { subjects: [], topics: {} };
  }
};

export const saveQuizAttempt = async (attempt: {
  contentId: string;
  score: number;
  totalQuestions: number;
  timeTaken?: number;
  answers: Record<string, string>;
}): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('user_quiz_attempts')
      .insert([{
        user_id: user.id,
        content_id: attempt.contentId,
        score: attempt.score,
        total_questions: attempt.totalQuestions,
        time_taken: attempt.timeTaken,
        answers: attempt.answers,
      }]);

    if (error) {
      console.error('Error saving quiz attempt:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in saveQuizAttempt:', error);
    return false;
  }
};

export const getUserQuizAttempts = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('user_quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching quiz attempts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserQuizAttempts:', error);
    return [];
  }
};
