
import { supabase } from "@/integrations/supabase/client";
import { ContentItem, ContentSubmission, ContentStatus, MCQItem } from "@/interfaces/content";
import { UserRole } from "@/contexts/UserRoleContext";

// Get all content from Supabase
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

    return data || [];
  } catch (error) {
    console.error('Failed to fetch content:', error);
    return [];
  }
};

// Get content by category (only approved content for public)
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

    return data || [];
  } catch (error) {
    console.error('Failed to fetch content by category:', error);
    return [];
  }
};

// Get content by subject and topic
export const getContentBySubjectAndTopic = async (subject: string, topic?: string): Promise<ContentItem[]> => {
  try {
    let query = supabase
      .from('content_items')
      .select('*')
      .eq('subject', subject)
      .eq('status', 'approved');

    if (topic) {
      query = query.eq('topic', topic);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching content by subject/topic:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch content by subject/topic:', error);
    return [];
  }
};

// Upload file to Supabase Storage
export const uploadFile = async (file: File, folder: string = 'uploads'): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('content-files')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('content-files')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Failed to upload file:', error);
    return null;
  }
};

// Submit new content to Supabase
export const submitContent = async (submission: ContentSubmission, userRole: UserRole): Promise<ContentItem | null> => {
  try {
    console.log("Submitting content to Supabase:", submission);
    
    // Upload files if present
    let imageUrl: string | undefined;
    let fileUrl: string | undefined;

    if (submission.imageFile) {
      imageUrl = await uploadFile(submission.imageFile, 'images') || undefined;
    }

    if (submission.documentFile) {
      fileUrl = await uploadFile(submission.documentFile, 'documents') || undefined;
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    const contentItem = {
      title: submission.title,
      description: submission.description,
      category: submission.category,
      tags: submission.tags,
      status: userRole === 'admin' ? 'approved' : 'pending',
      created_by: user?.id,
      image_url: imageUrl,
      file_url: fileUrl,
      deadline: submission.deadline,
      department: submission.department,
      government_level: submission.governmentLevel,
      cadre: submission.cadre,
      scholarship_type: submission.scholarshipType,
      institution: submission.institution,
      exam_type: submission.examType,
      exam_year: submission.examYear,
      meta_title: submission.metaTitle,
      meta_description: submission.metaDescription,
      meta_keywords: submission.metaKeywords,
      show_in_subjects: submission.showInSubjects ?? true,
      show_in_syllabus: submission.showInSyllabus ?? false,
      show_in_mock_tests: submission.showInMockTests ?? false,
    };

    const { data, error } = await supabase
      .from('content_items')
      .insert([contentItem])
      .select()
      .single();

    if (error) {
      console.error('Error submitting content:', error);
      throw error;
    }

    console.log("Content submitted successfully:", data);
    return data;
  } catch (error) {
    console.error('Failed to submit content:', error);
    return null;
  }
};

// Update content status
export const updateContentStatus = async (
  id: string, 
  status: ContentStatus, 
  updates?: Partial<ContentItem>
): Promise<ContentItem | null> => {
  try {
    const updateData = {
      status,
      ...updates,
    };

    const { data, error } = await supabase
      .from('content_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating content status:', error);
      throw error;
    }

    console.log("Content status updated:", data);
    return data;
  } catch (error) {
    console.error('Failed to update content status:', error);
    return null;
  }
};

// Delete content
export const deleteContent = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('content_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting content:', error);
      throw error;
    }

    console.log("Content deleted successfully");
    return true;
  } catch (error) {
    console.error('Failed to delete content:', error);
    return false;
  }
};

// Get subjects and topics
export const getSubjectsAndTopics = async () => {
  try {
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*')
      .order('name');

    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('*, subjects(name)')
      .order('name');

    if (subjectsError || topicsError) {
      console.error('Error fetching subjects/topics:', subjectsError || topicsError);
      throw subjectsError || topicsError;
    }

    const topicsBySubject: Record<string, string[]> = {};
    topics?.forEach(topic => {
      const subjectName = (topic as any).subjects?.name;
      if (subjectName) {
        if (!topicsBySubject[subjectName]) {
          topicsBySubject[subjectName] = [];
        }
        topicsBySubject[subjectName].push(topic.name);
      }
    });

    return {
      subjects: subjects?.map(s => s.name) || [],
      topics: topicsBySubject
    };
  } catch (error) {
    console.error('Failed to fetch subjects and topics:', error);
    return { subjects: [], topics: {} };
  }
};

// Save quiz attempt
export const saveQuizAttempt = async (
  contentId: string,
  score: number,
  totalQuestions: number,
  timeTaken: number,
  answers: Record<string, string>
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('User not authenticated');
      return false;
    }

    const { error } = await supabase
      .from('user_quiz_attempts')
      .insert([{
        user_id: user.id,
        content_id: contentId,
        score,
        total_questions: totalQuestions,
        time_taken: timeTaken,
        answers
      }]);

    if (error) {
      console.error('Error saving quiz attempt:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to save quiz attempt:', error);
    return false;
  }
};

// Get user quiz attempts
export const getUserQuizAttempts = async (userId?: string): Promise<any[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;

    if (!targetUserId) {
      return [];
    }

    const { data, error } = await supabase
      .from('user_quiz_attempts')
      .select('*, content_items(title, category)')
      .eq('user_id', targetUserId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching quiz attempts:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch quiz attempts:', error);
    return [];
  }
};
