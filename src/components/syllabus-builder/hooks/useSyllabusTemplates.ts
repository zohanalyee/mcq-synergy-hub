import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { SavedSyllabusTemplate, FilterState, QuizSettings } from '../interfaces';
import type { Json } from '@/integrations/supabase/types';

export const useSyllabusTemplates = (userId: string | undefined) => {
  const [templates, setTemplates] = useState<SavedSyllabusTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    if (!userId) {
      setTemplates([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_syllabus_templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our interface
      const transformedData: SavedSyllabusTemplate[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        name: item.name,
        filter_state: item.filter_state as unknown as FilterState,
        selected_topic_ids: item.selected_topic_ids || [],
        quiz_settings: item.quiz_settings as unknown as QuizSettings,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      setTemplates(transformedData);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const saveTemplate = async (
    name: string,
    filterState: FilterState,
    selectedTopicIds: string[],
    quizSettings: QuizSettings
  ): Promise<boolean> => {
    if (!userId) {
      toast({
        title: "Sign in Required",
        description: "Please sign in to save templates.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('saved_syllabus_templates')
        .insert([{
          user_id: userId,
          name: name.trim(),
          filter_state: filterState as unknown as Json,
          selected_topic_ids: selectedTopicIds,
          quiz_settings: quizSettings as unknown as Json
        }]);

      if (error) throw error;

      toast({
        title: "Template Saved!",
        description: `"${name}" has been saved successfully.`
      });

      fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Save Failed",
        description: "Could not save template. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteTemplate = async (templateId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('saved_syllabus_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Template Deleted",
        description: "Template has been removed."
      });

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Delete Failed",
        description: "Could not delete template. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    templates,
    loading,
    saveTemplate,
    deleteTemplate,
    refetch: fetchTemplates
  };
};
