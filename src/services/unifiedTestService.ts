
import { supabase } from "@/integrations/supabase/client";
import { ContentItem } from "@/interfaces/content";

export interface TestConfiguration {
  testType: 'subject' | 'job' | 'custom' | 'timed';
  subjectId?: string;
  topicIds?: string[];
  jobCategoryId?: string;
  timeLimit?: number;
  questionCount?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface TestAttempt {
  id: string;
  userId: string;
  contentId: string;
  testType: string;
  score: number;
  totalQuestions: number;
  timeTaken?: number;
  answers: Record<string, string>;
  completedAt: string;
}

export class UnifiedTestService {
  // Generate test questions based on configuration
  static async generateTest(config: TestConfiguration): Promise<ContentItem[]> {
    try {
      let query = supabase
        .from('content_items')
        .select('*')
        .eq('status', 'approved')
        .in('category', ['mcq', 'quiz']);

      // Apply filters based on test type
      switch (config.testType) {
        case 'subject':
          if (config.subjectId) {
            query = query.eq('subject', config.subjectId);
          }
          if (config.topicIds && config.topicIds.length > 0) {
            query = query.in('topic', config.topicIds);
          }
          break;

        case 'job':
          if (config.jobCategoryId) {
            // For job tests, we'll use department or government_level
            query = query.or(`department.eq.${config.jobCategoryId},government_level.eq.${config.jobCategoryId}`);
          }
          break;

        case 'custom':
          if (config.topicIds && config.topicIds.length > 0) {
            query = query.in('topic', config.topicIds);
          }
          break;

        case 'timed':
          // Timed tests can include all questions
          break;
      }

      // Apply difficulty filter
      if (config.difficulty) {
        query = query.eq('difficulty', config.difficulty);
      }

      // Limit number of questions
      if (config.questionCount) {
        query = query.limit(config.questionCount);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error generating test:', error);
        throw error;
      }

      return data?.map(this.transformDbRowToContentItem) || [];
    } catch (error) {
      console.error('Error in generateTest:', error);
      return [];
    }
  }

  // Save test attempt
  static async saveTestAttempt(attempt: {
    contentId: string;
    testType: string;
    score: number;
    totalQuestions: number;
    timeTaken?: number;
    answers: Record<string, string>;
  }): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('test_attempts')
        .insert([{
          user_id: user.id,
          content_id: attempt.contentId,
          test_type: attempt.testType,
          score: attempt.score,
          total_questions: attempt.totalQuestions,
          time_taken: attempt.timeTaken,
          answers: attempt.answers,
        }]);

      if (error) {
        console.error('Error saving test attempt:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in saveTestAttempt:', error);
      return false;
    }
  }

  // Get user test attempts
  static async getUserTestAttempts(userId: string): Promise<TestAttempt[]> {
    try {
      const { data, error } = await supabase
        .from('test_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching test attempts:', error);
        return [];
      }

      return data?.map(row => ({
        id: row.id,
        userId: row.user_id,
        contentId: row.content_id,
        testType: row.test_type,
        score: row.score,
        totalQuestions: row.total_questions,
        timeTaken: row.time_taken,
        answers: row.answers as Record<string, string>,
        completedAt: row.completed_at,
      })) || [];
    } catch (error) {
      console.error('Error in getUserTestAttempts:', error);
      return [];
    }
  }

  // Get subjects from database
  static async getSubjects(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching subjects:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSubjects:', error);
      return [];
    }
  }

  // Get topics by subject
  static async getTopicsBySubject(subjectId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('subject_id', subjectId)
        .order('name');

      if (error) {
        console.error('Error fetching topics:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTopicsBySubject:', error);
      return [];
    }
  }

  // Get job categories
  static async getJobCategories(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('job_categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching job categories:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getJobCategories:', error);
      return [];
    }
  }

  // Helper method to transform database row to ContentItem
  private static transformDbRowToContentItem(row: any): ContentItem {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      tags: row.tags || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      status: row.status,
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
  }
}
