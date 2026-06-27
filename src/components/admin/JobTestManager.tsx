import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useJobTestManagement } from "@/hooks/useJobTestManagement";
import AddJobTestDialog from "./job-test/AddJobTestDialog";
import JobTestTable from "./job-test/JobTestTable";
import { BulkJobTestImportDialog } from "./job-test/BulkJobTestImportDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileJson, Plus, Settings, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  JobTestDefinition,
  getJobTestDefinitions,
  upsertJobTestDefinition,
} from "@/services/jobTestService";
import JobTestDefinitionEditor from "./job-test/JobTestDefinitionEditor";

const JobTestManager = () => {
  const queryClient = useQueryClient();
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [definitions, setDefinitions] = useState<JobTestDefinition[]>([]);
  const [editing, setEditing] = useState<JobTestDefinition | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    jobTests,
    definitions: linkableDefinitions,
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
    handleStartEdit,
    handleRemoveJobTest,
    handleEnhanceJobTest,
    handleEnhanceAll,
    enhancingId,
    editingId,
    definitionMode, setDefinitionMode,
    definitionId, setDefinitionId,
    resetForm,
  } = useJobTestManagement();

  const loadDefinitions = async () => {
    setLoading(true);
    setDefinitions(await getJobTestDefinitions());
    setLoading(false);
  };

  useEffect(() => {
    loadDefinitions();
  }, []);

  const handleBulkImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["job-tests"] });
  };

  const createBlank = async () => {
    const created = await upsertJobTestDefinition({
      job_title: "New Job Test",
      status: "draft",
      syllabus: { sections: [] },
      sample_questions: {},
    } as any);
    if (created) {
      toast.success("Created draft");
      await loadDefinitions();
      setEditing(created);
    } else {
      toast.error("Failed to create");
    }
  };

  if (editing) {
    return (
      <JobTestDefinitionEditor
        definition={editing}
        onSaved={(d) => {
          setEditing(d);
          loadDefinitions();
        }}
        onClose={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* New isolated system */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Job Test Definitions (Isolated System)</h3>
            <p className="text-xs text-muted-foreground">
              Dedicated AI-only question pool per job test. Curate syllabus + samples, generate, approve, publish.
            </p>
          </div>
          <Button onClick={createBlank}>
            <Plus className="h-4 w-4 mr-1" /> New Definition
          </Button>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : definitions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No definitions yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {definitions.map((d) => (
              <Card key={d.id} className="p-3 flex justify-between items-start gap-2">
                <div>
                  <div className="flex gap-2 items-center">
                    <span className="font-medium">{d.job_title}</span>
                    <Badge
                      variant={
                        d.status === "published"
                          ? "default"
                          : d.status === "archived"
                            ? "outline"
                            : "secondary"
                      }
                    >
                      {d.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {d.department || "—"} • {d.syllabus?.sections?.length || 0} sections
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setEditing(d)}>
                  <Settings className="h-4 w-4 mr-1" /> Edit
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Legacy job_tests list */}
      <section className="space-y-3 border-t pt-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Legacy Job Tests</h3>
          <div className="flex gap-2">
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
            <AddJobTestDialog
              isOpen={isAddDialogOpen}
              onOpenChange={setIsAddDialogOpen}
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              organization={organization}
              setOrganization={setOrganization}
              duration={duration}
              setDuration={setDuration}
              questions={questions}
              setQuestions={setQuestions}
              syllabusItems={syllabusItems}
              onAddSyllabusItem={handleAddSyllabusItem}
              onRemoveSyllabusItem={handleRemoveSyllabusItem}
              onSyllabusItemChange={handleSyllabusItemChange}
              onAddJobTest={handleAddJobTest}
              onReset={resetForm}
            />
          </div>
        </div>
        <JobTestTable
          jobTests={jobTests}
          onRemove={handleRemoveJobTest}
          onEnhance={handleEnhanceJobTest}
          enhancingId={enhancingId}
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
