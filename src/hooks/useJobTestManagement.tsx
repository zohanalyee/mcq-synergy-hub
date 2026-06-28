import { useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { JobTest, getJobTests, removeJobTest, enhanceJobTestSEO } from "@/services/jobTestService";
import { toast } from "sonner";

export function useJobTestManagement() {
  const queryClient = useQueryClient();

  const { data: jobTests = [], isLoading } = useQuery({
    queryKey: ["job-tests"],
    queryFn: getJobTests,
  });

  const [enhancingId, setEnhancingId] = useState<string | null>(null);

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
    if (window.confirm(`Are you sure you want to delete this mock test?`)) {
      const removed = await removeJobTest(id);
      if (removed) {
        queryClient.invalidateQueries({ queryKey: ["job-tests"] });
        toast.success("Mock test removed successfully");
      } else {
        toast.error("Failed to remove mock test");
      }
    }
  };

  return {
    jobTests,
    isLoading,
    handleRemoveJobTest,
    handleEnhanceJobTest,
    handleEnhanceAll,
    enhancingId,
  };
}
