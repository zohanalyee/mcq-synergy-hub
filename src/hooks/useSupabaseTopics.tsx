import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { Topic, TopicsData, getTopics, getTopicsBySubject, addTopic, removeTopic } from "@/services/supabaseTopicService";

export function useSupabaseTopics() {
  const [allTopics, setAllTopics] = useState<TopicsData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load topics on mount
  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTopics();
      setAllTopics(data);
    } catch (err) {
      console.error("Error loading topics:", err);
      setError("Failed to load topics");
      toast.error("Failed to load topics");
    } finally {
      setLoading(false);
    }
  };

  const loadTopicsForSubject = async (subjectId: string) => {
    try {
      const topics = await getTopicsBySubject(subjectId);
      return topics;
    } catch (error) {
      console.error("Error loading topics for subject:", error);
      toast.error("Failed to load topics for subject");
      return [];
    }
  };

  const handleAddTopic = async (subjectId: string, subjectName: string, topicData: Omit<Topic, 'id' | 'subject_id' | 'created_at'>) => {
    try {
      const newTopic = await addTopic(subjectId, topicData);
      if (newTopic) {
        setAllTopics(prev => ({
          ...prev,
          [subjectName]: [...(prev[subjectName] || []), newTopic]
        }));
        toast.success(`Topic "${topicData.name}" added successfully`);
        return newTopic;
      } else {
        toast.error("Failed to add topic");
        return null;
      }
    } catch (error) {
      console.error("Error adding topic:", error);
      toast.error("Failed to add topic");
      return null;
    }
  };

  const handleRemoveTopic = async (topicId: string, subjectName: string, topicName: string) => {
    try {
      const success = await removeTopic(topicId);
      if (success) {
        setAllTopics(prev => ({
          ...prev,
          [subjectName]: (prev[subjectName] || []).filter(t => t.id !== topicId)
        }));
        toast.success(`Topic "${topicName}" removed successfully`);
        return true;
      } else {
        toast.error("Failed to remove topic");
        return false;
      }
    } catch (error) {
      console.error("Error removing topic:", error);
      toast.error("Failed to remove topic");
      return false;
    }
  };

  return {
    allTopics,
    loading,
    error,
    loadTopics,
    loadTopicsForSubject,
    handleAddTopic,
    handleRemoveTopic
  };
}