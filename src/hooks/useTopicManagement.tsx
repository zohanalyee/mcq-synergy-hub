
import { useState, useEffect } from 'react';
import { Topic, TopicsData } from "@/data/topicsData";
import { getSubjects } from "@/services/subjectService";
import { getTopics, addTopic, removeTopic } from "@/services/topicService";
import { toast } from "sonner";

export function useTopicManagement() {
  const [allTopics, setAllTopics] = useState<TopicsData>(getTopics());
  const [subjects, setSubjects] = useState(getSubjects());
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Get topics for the selected subject
  const currentTopics = selectedSubject ? (allTopics[selectedSubject] || []) : [];

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0].title);
    }
  }, [subjects, selectedSubject]);

  const handleAddTopic = () => {
    if (!title || !content || !selectedSubject) {
      toast.error("Please fill out all required fields");
      return;
    }

    const newTopic: Topic = {
      title,
      content,
    };

    const added = addTopic(selectedSubject, newTopic);
    
    if (added) {
      setAllTopics(getTopics());
      setIsAddDialogOpen(false);
      resetForm();
      toast.success(`Topic "${title}" added to ${selectedSubject}`);
    } else {
      toast.error("Failed to add topic");
    }
  };

  const handleRemoveTopic = (topicTitle: string) => {
    if (window.confirm(`Are you sure you want to delete the topic "${topicTitle}"?`)) {
      const removed = removeTopic(selectedSubject, topicTitle);
      
      if (removed) {
        setAllTopics(getTopics());
        toast.success(`Topic "${topicTitle}" removed successfully`);
      } else {
        toast.error("Failed to remove topic");
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
    handleAddTopic,
    handleRemoveTopic,
    resetForm
  };
}
