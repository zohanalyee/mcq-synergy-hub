
import { useState, useEffect } from 'react';
import { Topic, TopicsData } from "@/data/topicsData";
import { useSupabaseSubjects } from "./useSupabaseSubjects";
import { useSupabaseTopics } from "./useSupabaseTopics";
import { toast } from "sonner";

export function useTopicManagement() {
  const { subjects } = useSupabaseSubjects();
  const { allTopics, handleAddTopic, handleRemoveTopic } = useSupabaseTopics();
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Get topics for the selected subject
  const currentTopics = selectedSubject ? (allTopics[selectedSubject] || []) : [];

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
    }
  };

  const handleRemoveTopicLocal = async (topicName: string) => {
    if (window.confirm(`Are you sure you want to delete the topic "${topicName}"?`)) {
      const topic = currentTopics.find(t => t.name === topicName);
      if (topic && topic.id) {
        await handleRemoveTopic(topic.id, selectedSubject, topicName);
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
    resetForm
  };
}
