import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SubjectTopicValidation {
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  created: {
    subject: boolean;
    topic: boolean;
  };
}

/**
 * Validates and ensures subject and topic exist in the database
 * Creates them if they don't exist
 * Returns the validated subject and topic IDs
 */
export const validateAndCreateSubjectTopic = async (
  subjectName: string,
  topicName: string
): Promise<SubjectTopicValidation | null> => {
  try {
    if (!subjectName || !topicName) {
      console.error("Subject and topic names are required");
      return null;
    }

    const result: SubjectTopicValidation = {
      subjectId: '',
      subjectName: subjectName.trim(),
      topicId: '',
      topicName: topicName.trim(),
      created: {
        subject: false,
        topic: false
      }
    };

    // Check if subject exists
    const { data: existingSubject } = await supabase
      .from('subjects')
      .select('id, name')
      .ilike('name', result.subjectName)
      .maybeSingle();

    if (existingSubject) {
      result.subjectId = existingSubject.id;
    } else {
      // Create subject
      const { data: newSubject, error: subjectError } = await supabase
        .from('subjects')
        .insert({
          name: result.subjectName,
          description: `Auto-generated subject for ${result.subjectName}`,
          category: 'general'
        })
        .select()
        .single();

      if (subjectError || !newSubject) {
        console.error("Error creating subject:", subjectError);
        return null;
      }

      result.subjectId = newSubject.id;
      result.created.subject = true;
    }

    // Check if topic exists for this subject
    const { data: existingTopic } = await supabase
      .from('topics')
      .select('id, name')
      .eq('subject_id', result.subjectId)
      .ilike('name', result.topicName)
      .maybeSingle();

    if (existingTopic) {
      result.topicId = existingTopic.id;
    } else {
      // Create topic
      const { data: newTopic, error: topicError } = await supabase
        .from('topics')
        .insert({
          subject_id: result.subjectId,
          name: result.topicName,
          description: `Auto-generated topic for ${result.topicName}`
        })
        .select()
        .single();

      if (topicError || !newTopic) {
        console.error("Error creating topic:", topicError);
        return null;
      }

      result.topicId = newTopic.id;
      result.created.topic = true;
    }

    return result;
  } catch (error) {
    console.error("Error validating subject/topic:", error);
    return null;
  }
};

/**
 * Validates a batch of questions and ensures all subjects/topics exist
 * Returns a summary of what was created
 */
export const validateQuestionBatch = async (
  questions: Array<{ subject: string; topic: string; [key: string]: any }>
): Promise<{
  validations: Map<string, SubjectTopicValidation>;
  summary: {
    totalQuestions: number;
    subjectsCreated: Set<string>;
    topicsCreated: Set<string>;
    errors: string[];
  };
}> => {
  const validations = new Map<string, SubjectTopicValidation>();
  const summary = {
    totalQuestions: questions.length,
    subjectsCreated: new Set<string>(),
    topicsCreated: new Set<string>(),
    errors: [] as string[]
  };

  for (const question of questions) {
    if (!question.subject || !question.topic) {
      summary.errors.push(`Question "${question.title || 'Unknown'}" missing subject or topic`);
      continue;
    }

    const key = `${question.subject}|${question.topic}`;
    
    // Skip if already validated
    if (validations.has(key)) continue;

    const validation = await validateAndCreateSubjectTopic(
      question.subject,
      question.topic
    );

    if (!validation) {
      summary.errors.push(`Failed to validate subject "${question.subject}" and topic "${question.topic}"`);
      continue;
    }

    validations.set(key, validation);

    if (validation.created.subject) {
      summary.subjectsCreated.add(validation.subjectName);
    }
    if (validation.created.topic) {
      summary.topicsCreated.add(validation.topicName);
    }
  }

  return { validations, summary };
};

/**
 * Prepares a question for upload by ensuring it has valid subject/topic references
 */
export const prepareQuestionForUpload = async (
  question: any,
  validation?: SubjectTopicValidation
): Promise<any> => {
  let finalValidation = validation;

  if (!finalValidation && question.subject && question.topic) {
    finalValidation = await validateAndCreateSubjectTopic(
      question.subject,
      question.topic
    );
  }

  if (!finalValidation) {
    throw new Error("Cannot upload question without valid subject/topic");
  }

  // Return question with validated subject/topic names (using the exact names from database)
  return {
    ...question,
    subject: finalValidation.subjectName,
    topic: finalValidation.topicName
  };
};

/**
 * Get all subjects that have associated questions
 */
export const getSubjectsWithQuestions = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('content_items')
      .select('subject')
      .eq('category', 'mcq')
      .eq('status', 'approved')
      .not('subject', 'is', null);

    if (error) {
      console.error("Error fetching subjects:", error);
      return [];
    }

    // Get unique subjects and validate they exist in subjects table
    const uniqueSubjects = [...new Set(data.map(item => item.subject).filter(Boolean))];
    
    const { data: validSubjects } = await supabase
      .from('subjects')
      .select('name')
      .in('name', uniqueSubjects);

    return validSubjects?.map(s => s.name) || [];
  } catch (error) {
    console.error("Error loading subjects with questions:", error);
    return [];
  }
};

/**
 * Get all topics for a subject that have associated questions
 */
export const getTopicsWithQuestions = async (subjectName: string): Promise<string[]> => {
  try {
    // First get the subject ID
    const { data: subject } = await supabase
      .from('subjects')
      .select('id')
      .ilike('name', subjectName)
      .maybeSingle();

    if (!subject) return [];

    // Get topics from database
    const { data: topicsData } = await supabase
      .from('topics')
      .select('name')
      .eq('subject_id', subject.id);

    if (!topicsData) return [];

    // Get topics that have questions
    const { data: questionsData } = await supabase
      .from('content_items')
      .select('topic')
      .eq('category', 'mcq')
      .eq('status', 'approved')
      .ilike('subject', subjectName)
      .not('topic', 'is', null);

    const questionTopics = new Set(questionsData?.map(q => q.topic.toLowerCase()) || []);
    
    // Return only topics that exist in both database and have questions
    return topicsData
      .filter(t => questionTopics.has(t.name.toLowerCase()))
      .map(t => t.name);
  } catch (error) {
    console.error("Error loading topics with questions:", error);
    return [];
  }
};
