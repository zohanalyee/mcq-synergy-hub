import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { JobTest, SyllabusItem, getJobTests, addJobTest, updateJobTest, removeJobTest, enhanceJobTestSEO, getJobTestDefinitions, upsertJobTestDefinition, JobTestDefinition } from "@/services/jobTestService";
import { DefinitionMode } from "@/components/admin/job-test/DefinitionLinkField";
import { toast } from "sonner";

export function useJobTestManagement() {
  const queryClient = useQueryClient();

  const { data: jobTests = [], isLoading } = useQuery({
    queryKey: ["job-tests"],
    queryFn: getJobTests,
  });

  const { data: definitions = [] } = useQuery({
    queryKey: ["job-test-definitions"],
    queryFn: getJobTestDefinitions,
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [enhancingId, setEnhancingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [organization, setOrganization] = useState('');
  const [duration, setDuration] = useState(90);
  const [questions, setQuestions] = useState(100);
  const [syllabusItems, setSyllabusItems] = useState<SyllabusItem[]>([
    { topic: '', percentage: 0 }
  ]);
  const [definitionMode, setDefinitionMode] = useState<DefinitionMode>("skip");
  const [definitionId, setDefinitionId] = useState<string | null>(null);


  const handleAddSyllabusItem = () => {
    setSyllabusItems([...syllabusItems, { topic: '', percentage: 0 }]);
  };

  const handleRemoveSyllabusItem = (index: number) => {
    setSyllabusItems(syllabusItems.filter((_, i) => i !== index));
  };

  const handleSyllabusItemChange = (index: number, field: keyof SyllabusItem, value: string | number) => {
    const newItems = [...syllabusItems];
    if (field === 'topic') newItems[index].topic = value as string;
    else if (field === 'percentage') newItems[index].percentage = value as number;
    setSyllabusItems(newItems);
  };

  const handleAddJobTest = async () => {
    if (!title || !description || !organization || !duration || !questions) {
      toast.error("Please fill out all required fields");
      return;
    }
    const validSyllabusItems = syllabusItems.filter(item => item.topic && item.percentage > 0);
    if (validSyllabusItems.length === 0) {
      toast.error("Please add at least one valid syllabus item");
      return;
    }
    const totalPercentage = validSyllabusItems.reduce((sum, item) => sum + item.percentage, 0);
    if (totalPercentage < 90 || totalPercentage > 110) {
      toast.error(`Total syllabus percentage (${totalPercentage}%) should be approximately 100%`);
      return;
    }

    const added = await addJobTest({
      title,
      description,
      organization,
      duration,
      questions,
      syllabus: validSyllabusItems,
    });

    if (added) {
      queryClient.invalidateQueries({ queryKey: ["job-tests"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast.success(`Job Test "${title}" added successfully`);
      // Auto-trigger AI Magic SEO refinement on create (non-blocking).
      toast.info("✨ Generating SEO with AI Magic…");
      enhanceJobTestSEO(added)
        .then((res) => {
          if (res) {
            queryClient.invalidateQueries({ queryKey: ["job-tests"] });
            toast.success("✨ SEO metadata generated");
          }
        })
        .catch(() => {/* non-blocking; manual re-run available */});
    } else {
      toast.error("Failed to add job test");
    }
  };

  const handleEnhanceJobTest = async (test: JobTest) => {
    setEnhancingId(test.id);
    try {
      const res = await enhanceJobTestSEO(test);
      if (res) {
        queryClient.invalidateQueries({ queryKey: ["job-tests"] });
        toast.success(`✨ SEO updated for "${test.title}"`);
      } else {
        toast.error("AI Magic failed. Please try again.");
      }
    } finally {
      setEnhancingId(null);
    }
  };

  const handleEnhanceAll = async () => {
    if (jobTests.length === 0) {
      toast.error("No mock tests to enhance");
      return;
    }
    if (!window.confirm(`Run AI Magic SEO on all ${jobTests.length} mock tests? This runs one at a time and may take a while.`)) {
      return;
    }
    let ok = 0;
    let failed = 0;
    for (const test of jobTests) {
      setEnhancingId(test.id);
      toast.info(`✨ Enhancing ${ok + failed + 1}/${jobTests.length}: ${test.title}`);
      try {
        const res = await enhanceJobTestSEO(test);
        if (res) ok++; else failed++;
      } catch {
        failed++;
      }
    }
    setEnhancingId(null);
    queryClient.invalidateQueries({ queryKey: ["job-tests"] });
    toast.success(`AI Magic complete: ${ok} succeeded${failed ? `, ${failed} failed` : ""}`);
  };

  const handleRemoveJobTest = async (id: string) => {
    if (window.confirm(`Are you sure you want to delete this job test?`)) {
      const removed = await removeJobTest(id);
      if (removed) {
        queryClient.invalidateQueries({ queryKey: ["job-tests"] });
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
    isLoading,
    isAddDialogOpen,
    setIsAddDialogOpen,
    title, setTitle,
    description, setDescription,
    organization, setOrganization,
    duration, setDuration,
    questions, setQuestions,
    syllabusItems,
    handleAddSyllabusItem,
    handleRemoveSyllabusItem,
    handleSyllabusItemChange,
    handleAddJobTest,
    handleRemoveJobTest,
    handleEnhanceJobTest,
    handleEnhanceAll,
    enhancingId,
    resetForm
  };
}
