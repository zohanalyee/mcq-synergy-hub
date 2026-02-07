
import { useState, useEffect, useCallback } from 'react';
import { useSupabaseSubjects } from "./useSupabaseSubjects";
import { useSupabaseTopics } from "./useSupabaseTopics";
import { getTopicsWithRAGStatus, TopicWithRAGStatus } from "@/services/lmsStructureService";
import { toast } from "sonner";

export function useTopicManagement() {
  const { subjects } = useSupabaseSubjects();
  const { allTopics, handleAddTopic, handleRemoveTopic } = useSupabaseTopics();
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [ragTopics, setRagTopics] = useState<TopicWithRAGStatus[]>([]);
  const [loadingRAG, setLoadingRAG] = useState(false);

  // Get the selected subject's ID
  const selectedSubjectObj = subjects.find(s => s.name === selectedSubject);
  const selectedSubjectId = selectedSubjectObj?.id;

  // Fetch RAG-enriched topics when subject changes
  const fetchRAGTopics = useCallback(async () => {
    if (!selectedSubjectId) {
      setRagTopics([]);
      return;
    }
    setLoadingRAG(true);
    try {
      const topics = await getTopicsWithRAGStatus(selectedSubjectId);
      setRagTopics(topics);
    } catch (error) {
      console.error("Error fetching RAG topics:", error);
      // Fallback to plain topics
      setRagTopics([]);
    } finally {
      setLoadingRAG(false);
    }
  }, [selectedSubjectId]);

  useEffect(() => {
    fetchRAGTopics();
  }, [fetchRAGTopics]);

  // Use RAG-enriched topics if available, fall back to plain topics
  const currentTopics = ragTopics.length > 0
    ? ragTopics
    : selectedSubject ? (allTopics[selectedSubject] || []) : [];

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0].name || '');
    }
  }, [subjects, selectedSubject]);

  const handleAddTopicLocal = async () => {
    if (!title || !content || !selectedSubject) {
      toast.error("Please fill out all required fields");
      return;
    }

    const subject = subjects.find(s => s.name === selectedSubject);
    if (!subject) {
      toast.error("Selected subject not found");
      return;
    }

    const result = await handleAddTopic(subject.id!, selectedSubject, {
      name: title,
      description: content,
    });
    
    if (result) {
      setIsAddDialogOpen(false);
      resetForm();
      fetchRAGTopics(); // Refresh RAG data after adding topic
    }
  };

  const handleRemoveTopicLocal = async (topicName: string) => {
    if (window.confirm(`Are you sure you want to delete the topic "${topicName}"?`)) {
      const topic = currentTopics.find(t => t.name === topicName);
      if (topic && topic.id) {
        await handleRemoveTopic(topic.id, selectedSubject, topicName);
        fetchRAGTopics(); // Refresh RAG data after removing topic
      }
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
  };

  return {
    allTopics,
    subjects,
    selectedSubject,
    setSelectedSubject,
    isAddDialogOpen,
    setIsAddDialogOpen,
    title,
    setTitle,
    content,
    setContent,
    currentTopics,
    handleAddTopic: handleAddTopicLocal,
    handleRemoveTopic: handleRemoveTopicLocal,
    resetForm,
    refreshTopics: fetchRAGTopics,
  };
}
