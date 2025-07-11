
import { supabase } from "@/integrations/supabase/client";
import { ContentItem, ContentSubmission, ContentCategory, ContentStatus } from "@/interfaces/content";
import { UserRole } from "@/contexts/UserRoleContext";
import { toast } from "sonner";

// Enhanced content service with real-time updates and proper error handling
export class EnhancedContentService {
  // Submit content with real-time feedback
  static async submitContent(submission: ContentSubmission, userRole?: UserRole): Promise<ContentItem | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Authentication required');
      }

      // Prepare data for database with proper field mapping
      const contentData = {
        title: submission.title,
        description: submission.description || '',
        category: submission.category,
        tags: submission.tags || [],
        status: 'pending' as ContentStatus,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        
        // Category-specific fields
        ...(submission.category === 'scholarship' && {
          deadline: submission.deadline || null,
          scholarship_type: submission.scholarshipType || null,
          institution: submission.institution || null,
        }),
        
        ...(submission.category === 'job' && {
          deadline: submission.deadline || null,
          department: submission.department || null,
          government_level: submission.governmentLevel || null,
          cadre: submission.cadre || null,
        }),
        
        ...(submission.category === 'mcq' && {
          subject: submission.subject || null,
          topic: submission.topic || null,
          options: submission.options || null,
          correct_option: submission.correctOption || null,
          difficulty: submission.difficulty || 'Medium',
          explanation: submission.explanation || '',
        }),
        
        ...(submission.category === 'quiz' && {
          subject: submission.subject || null,
          topic: submission.topic || null,
          time_limit: submission.timeLimit || 30,
          marks: submission.marks || 10,
          questions: submission.questions ? JSON.stringify(submission.questions) : JSON.stringify([]),
        }),
        
        ...(submission.category === 'past_paper' && {
          exam_type: submission.examType || null,
          exam_year: submission.examYear || null,
          subject: submission.subject || null,
        }),

        // File URLs - only use direct URLs (files should be pre-uploaded)
        image_url: submission.imageUrl || null,
        file_url: submission.fileUrl || null,

        // SEO fields
        meta_title: submission.metaTitle || null,
        meta_description: submission.metaDescription || null,
        meta_keywords: submission.metaKeywords || null,

        // Visibility settings
        show_in_subjects: submission.showInSubjects ?? true,
        show_in_syllabus: submission.showInSyllabus ?? false,
        show_in_mock_tests: submission.showInMockTests ?? false,
      };

      console.log('Submitting content data:', contentData);

      const { data, error } = await supabase
        .from('content_items')
        .insert(contentData)
        .select()
        .single();

      if (error) {
        console.error('Content submission error:', error);
        throw error;
      }

      return this.transformDbRowToContentItem(data);
    } catch (error) {
      console.error('Error in submitContent:', error);
      throw error;
    }
  }

  // Get all subjects and topics from database
  static async getSubjectsAndTopics(): Promise<{ subjects: any[]; topics: Record<string, any[]> }> {
    try {
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (subjectsError) {
        console.error('Error fetching subjects:', subjectsError);
        return { subjects: [], topics: {} };
      }

      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select(`
          *,
          subjects!inner(id, name)
        `)
        .order('name');

      if (topicsError) {
        console.error('Error fetching topics:', topicsError);
        return { subjects: subjects || [], topics: {} };
      }

      const topicsRecord: Record<string, any[]> = {};
      topicsData?.forEach((topic: any) => {
        const subjectName = topic.subjects?.name;
        if (subjectName) {
          if (!topicsRecord[subjectName]) {
            topicsRecord[subjectName] = [];
          }
          topicsRecord[subjectName].push(topic);
        }
      });

      return { subjects: subjects || [], topics: topicsRecord };
    } catch (error) {
      console.error('Error in getSubjectsAndTopics:', error);
      return { subjects: [], topics: {} };
    }
  }

  // Transform database row to ContentItem
  private static transformDbRowToContentItem(row: any): ContentItem {
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
      questions: row.questions ? (typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions) : [],
      showInSubjects: row.show_in_subjects,
      showInSyllabus: row.show_in_syllabus,
      showInMockTests: row.show_in_mock_tests,
    };
  }

  // Setup real-time subscriptions
  static setupRealTimeUpdates(callback: (payload: any) => void) {
    const channel = supabase
      .channel('content-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_items'
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}
