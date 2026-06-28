import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useJobTestManagement } from "@/hooks/useJobTestManagement";
import MockTestEditor from "./job-test/MockTestEditor";
import JobTestTable from "./job-test/JobTestTable";
import { BulkJobTestImportDialog } from "./job-test/BulkJobTestImportDialog";
import { Button } from "@/components/ui/button";
import { FileJson, Plus, Sparkles, Loader2 } from "lucide-react";
import { JobTest } from "@/services/jobTestService";

const JobTestManager = () => {
  const queryClient = useQueryClient();
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<JobTest | null>(null);

  const {
    jobTests,
    handleRemoveJobTest,
    handleEnhanceJobTest,
    handleEnhanceAll,
    enhancingId,
  } = useJobTestManagement();

  const openCreate = () => {
    setEditingTest(null);
    setEditorOpen(true);
  };

  const openEdit = (test: JobTest) => {
    setEditingTest(test);
    setEditorOpen(true);
  };

  const handleBulkImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["job-tests"] });
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-medium">Mock Tests</h3>
            <p className="text-xs text-muted-foreground">
              One place to author each mock test — basic info, syllabus, samples and AI question generation.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={handleEnhanceAll}
              disabled={!!enhancingId}
              className="gap-2"
            >
              {enhancingId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 text-primary" />
              )}
              Run AI Magic on All
            </Button>
            <Button variant="outline" onClick={() => setIsBulkImportOpen(true)} className="gap-2">
              <FileJson className="h-4 w-4" />
              Bulk Import JSON
            </Button>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Add Mock Test
            </Button>
          </div>
        </div>

        <JobTestTable
          jobTests={jobTests}
          onRemove={handleRemoveJobTest}
          onEnhance={handleEnhanceJobTest}
          onEdit={(t) => openEdit(t as JobTest)}
          enhancingId={enhancingId}
        />

        <MockTestEditor
          isOpen={editorOpen}
          onOpenChange={setEditorOpen}
          test={editingTest}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["job-tests"] })}
        />

        <BulkJobTestImportDialog
          open={isBulkImportOpen}
          onOpenChange={setIsBulkImportOpen}
          onSuccess={handleBulkImportSuccess}
        />
      </section>
    </div>
  );
};

export default JobTestManager;
