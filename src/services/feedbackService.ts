
import { supabase } from '@/integrations/supabase/client';

export type FeedbackType = 'suggestion' | 'bug' | 'question' | 'other';

export interface FeedbackSubmission {
  message: string;
  type: FeedbackType;
}

export interface FeedbackItem extends FeedbackSubmission {
  id: string;
  user_id: string;
  created_at: string;
  status: 'new' | 'reviewed' | 'resolved';
}

export const submitFeedback = async (feedback: FeedbackSubmission): Promise<FeedbackItem | null> => {
  try {
    const user = supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('feedback')
      .insert([{ 
        ...feedback,
        user_id: (await user).data.user?.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error submitting feedback:', error);
      return null;
    }

    return data as FeedbackItem;
  } catch (error) {
    console.error('Error in submitFeedback:', error);
    return null;
  }
};

export const getUserFeedback = async (): Promise<FeedbackItem[]> => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user feedback:', error);
      return [];
    }

    return data as FeedbackItem[];
  } catch (error) {
    console.error('Error in getUserFeedback:', error);
    return [];
  }
};
