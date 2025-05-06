
import { useState } from 'react';
import { JobTest, SyllabusItem } from "@/data/jobTestsData";
import { getJobTests, addJobTest, removeJobTest } from "@/services/jobTestService";
import { toast } from "sonner";

export function useJobTestManagement() {
  const [jobTests, setJobTests] = useState<JobTest[]>(getJobTests());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [organization, setOrganization] = useState('');
  const [duration, setDuration] = useState(90);
  const [questions, setQuestions] = useState(100);
  const [syllabusItems, setSyllabusItems] = useState<SyllabusItem[]>([
    { topic: '', percentage: 0 }
  ]);

  const handleAddSyllabusItem = () => {
    setSyllabusItems([...syllabusItems, { topic: '', percentage: 0 }]);
  };

  const handleRemoveSyllabusItem = (index: number) => {
    setSyllabusItems(syllabusItems.filter((_, i) => i !== index));
  };

  const handleSyllabusItemChange = (index: number, field: keyof SyllabusItem, value: string | number) => {
    const newItems = [...syllabusItems];
    if (field === 'topic') {
      newItems[index].topic = value as string;
    } else if (field === 'percentage') {
      newItems[index].percentage = value as number;
    }
    setSyllabusItems(newItems);
  };

  const handleAddJobTest = () => {
    if (!title || !description || !organization || !duration || !questions) {
      toast.error("Please fill out all required fields");
      return;
    }

    // Validate syllabus items
    const validSyllabusItems = syllabusItems.filter(item => item.topic && item.percentage > 0);
    if (validSyllabusItems.length === 0) {
      toast.error("Please add at least one valid syllabus item");
      return;
    }

    // Check if total percentage adds up to around 100
    const totalPercentage = validSyllabusItems.reduce((sum, item) => sum + item.percentage, 0);
    if (totalPercentage < 90 || totalPercentage > 110) {
      toast.error(`Total syllabus percentage (${totalPercentage}%) should be approximately 100%`);
      return;
    }

    const newJobTest = {
      title,
      description,
      organization,
      duration,
      questions,
      syllabus: validSyllabusItems,
    };

    const added = addJobTest(newJobTest);
    
    if (added) {
      setJobTests(getJobTests());
      setIsAddDialogOpen(false);
      resetForm();
      toast.success(`Job Test "${title}" added successfully`);
    } else {
      toast.error("Failed to add job test");
    }
  };

  const handleRemoveJobTest = (id: number) => {
    if (window.confirm(`Are you sure you want to delete this job test?`)) {
      const removed = removeJobTest(id);
      
      if (removed) {
        setJobTests(getJobTests());
        toast.success("Job test removed successfully");
      } else {
        toast.error("Failed to remove job test");
      }
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setOrganization('');
    setDuration(90);
    setQuestions(100);
    setSyllabusItems([{ topic: '', percentage: 0 }]);
  };

  return {
    jobTests,
    isAddDialogOpen,
    setIsAddDialogOpen,
    title,
    setTitle,
    description,
    setDescription,
    organization,
    setOrganization,
    duration,
    setDuration,
    questions,
    setQuestions,
    syllabusItems,
    handleAddSyllabusItem,
    handleRemoveSyllabusItem,
    handleSyllabusItemChange,
    handleAddJobTest,
    handleRemoveJobTest,
    resetForm
  };
}
