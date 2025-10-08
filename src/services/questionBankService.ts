import { supabase } from "@/integrations/supabase/client";
import { MCQItem } from "@/interfaces/content";

export interface QuestionBankItem {
  id: string;
  title: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctOption: 'A' | 'B' | 'C' | 'D';
  subject: string;
  topic: string;
  subtopic?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  explanation?: string;
  reference_material?: string;
  question_type: string;
  tags: string[];
  usage_count: number;
  last_used_at?: string;
  is_featured: boolean;
  created_at: string;
}

export interface QuestionFilters {
  subjects?: string[];
  topics?: string[];
  subtopics?: string[];
  difficulties?: string[];
  tags?: string[];
  question_type?: string;
  is_featured?: boolean;
  limit?: number;
  offset?: number;
}

export interface CustomTestSession {
  id?: string;
  user_id?: string;
  session_name: string;
  subjects: string[];
  topics: string[];
  subtopics: string[];
  difficulty_levels: string[];
  question_count: number;
  time_limit: number;
  questions: QuestionBankItem[];
  is_active: boolean;
  expires_at?: string;
}

// Get questions from the question bank with filters
export const getQuestionBank = async (filters: QuestionFilters = {}): Promise<QuestionBankItem[]> => {
  try {
    let query = supabase
      .from('content_items')
      .select('*')
      .eq('category', 'mcq')
      .eq('status', 'question_bank');

    // Apply filters
    if (filters.subjects?.length) {
      query = query.in('subject', filters.subjects);
    }
    if (filters.topics?.length) {
      query = query.in('topic', filters.topics);
    }
    if (filters.subtopics?.length) {
      query = query.in('subtopic', filters.subtopics);
    }
    if (filters.difficulties?.length) {
      query = query.in('difficulty', filters.difficulties);
    }
    if (filters.question_type) {
      query = query.eq('question_type', filters.question_type);
    }
    if (filters.is_featured !== undefined) {
      query = query.eq('is_featured', filters.is_featured);
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    // Order by usage count and created date
    query = query.order('is_featured', { ascending: false })
                 .order('usage_count', { ascending: false })
                 .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching question bank:", error);
      return [];
    }

    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      question: item.description || '',
      options: (typeof item.options === 'object' && item.options !== null) 
        ? item.options as { A: string; B: string; C: string; D: string; }
        : { A: '', B: '', C: '', D: '' },
      correctOption: item.correct_option as 'A' | 'B' | 'C' | 'D',
      subject: item.subject || '',
      topic: item.topic || '',
      subtopic: item.subtopic || '',
      difficulty: item.difficulty as 'Easy' | 'Medium' | 'Hard',
      explanation: item.explanation || '',
      reference_material: item.reference_material || '',
      question_type: item.question_type || 'mcq',
      tags: Array.isArray(item.tags) ? item.tags : [],
      usage_count: item.usage_count || 0,
      last_used_at: item.last_used_at,
      is_featured: item.is_featured || false,
      created_at: item.created_at
    }));
  } catch (error) {
    console.error("Error loading question bank:", error);
    return [];
  }
};

// Generate custom test from question bank
export const generateCustomTest = async (criteria: Omit<CustomTestSession, 'id' | 'questions'>): Promise<CustomTestSession | null> => {
  try {
    // Get questions based on criteria
    const questions = await getQuestionBank({
      subjects: criteria.subjects,
      topics: criteria.topics,
      subtopics: criteria.subtopics,
      difficulties: criteria.difficulty_levels,
      limit: criteria.question_count * 2 // Get more questions to have variety
    });

    if (questions.length === 0) {
      console.error("No questions found matching criteria");
      return null;
    }

    // Shuffle and select the requested number of questions
    const shuffledQuestions = questions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffledQuestions.slice(0, criteria.question_count);

    // Create test session
    const testSession: CustomTestSession = {
      ...criteria,
      questions: selectedQuestions,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
    };

    // Save to database if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('custom_test_sessions')
        .insert({
          user_id: user.id,
          session_name: criteria.session_name,
          subjects: criteria.subjects as any,
          topics: criteria.topics as any,
          subtopics: criteria.subtopics as any,
          difficulty_levels: criteria.difficulty_levels as any,
          question_count: criteria.question_count,
          time_limit: criteria.time_limit,
          questions: selectedQuestions as any,
          is_active: criteria.is_active,
          expires_at: testSession.expires_at
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving test session:", error);
      } else {
        testSession.id = data.id;
        testSession.user_id = user.id;
      }
    }

    // Update usage count for selected questions
    await Promise.all(selectedQuestions.map(q => 
      supabase
        .from('content_items')
        .update({ 
          usage_count: (q.usage_count || 0) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', q.id)
    ));

    return testSession;
  } catch (error) {
    console.error("Error generating custom test:", error);
    return null;
  }
};

// Get user's test sessions
export const getUserTestSessions = async (): Promise<CustomTestSession[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('custom_test_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching test sessions:", error);
      return [];
    }

    return (data || []).map(item => ({
      id: item.id,
      user_id: item.user_id,
      session_name: item.session_name,
      subjects: Array.isArray(item.subjects) ? item.subjects.map(s => String(s)) : [],
      topics: Array.isArray(item.topics) ? item.topics.map(t => String(t)) : [],
      subtopics: Array.isArray(item.subtopics) ? item.subtopics.map(st => String(st)) : [],
      difficulty_levels: Array.isArray(item.difficulty_levels) ? item.difficulty_levels.map(d => String(d)) : [],
      question_count: item.question_count,
      time_limit: item.time_limit,
      questions: Array.isArray(item.questions) ? item.questions as unknown as QuestionBankItem[] : [],
      is_active: item.is_active,
      expires_at: item.expires_at
    }));
  } catch (error) {
    console.error("Error loading test sessions:", error);
    return [];
  }
};

// Get question statistics for analytics
export const getQuestionStats = async () => {
  try {
    const { data, error } = await supabase
      .from('content_items')
      .select('subject, topic, difficulty, usage_count, is_featured')
      .eq('category', 'mcq')
      .eq('status', 'approved');

    if (error) {
      console.error("Error fetching question stats:", error);
      return null;
    }

    const stats = {
      totalQuestions: data.length,
      bySubject: {} as Record<string, number>,
      byDifficulty: { Easy: 0, Medium: 0, Hard: 0 },
      mostUsed: data.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0)).slice(0, 10),
      featuredCount: data.filter(q => q.is_featured).length
    };

    data.forEach(item => {
      if (item.subject) {
        stats.bySubject[item.subject] = (stats.bySubject[item.subject] || 0) + 1;
      }
      if (item.difficulty) {
        stats.byDifficulty[item.difficulty as keyof typeof stats.byDifficulty]++;
      }
    });

    return stats;
  } catch (error) {
    console.error("Error getting question stats:", error);
    return null;
  }
};

// Mark questions as featured
export const toggleQuestionFeatured = async (questionId: string, featured: boolean): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('content_items')
      .update({ is_featured: featured })
      .eq('id', questionId);

    if (error) {
      console.error("Error updating question featured status:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error toggling question featured:", error);
    return false;
  }
};