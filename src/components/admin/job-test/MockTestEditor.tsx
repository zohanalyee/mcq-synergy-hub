import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, FileJson, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  JobTest,
  SyllabusItem,
  JobTestDefinition,
  JobSyllabusSection,
  addJobTest,
  updateJobTest,
  upsertJobTestDefinition,
  getJobTestDefinition,
  enhanceJobTestSEO,
} from "@/services/jobTestService";
import SyllabusItemForm from "./SyllabusItemForm";
import SampleQuestionsEditor from "./SampleQuestionsEditor";
import GeneratedQuestionsTable from "./GeneratedQuestionsTable";
import GenerationLogsTable from "./GenerationLogsTable";
import SectionCoverageDashboard from "./SectionCoverageDashboard";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** The mock test being edited, or null when creating a new one. */
  test: JobTest | null;
  onSaved: () => void;
}

const emptySection = (): JobSyllabusSection => ({
  subject: "",
  percentage: 0,
  question_count: 0,
  topics: [],
  style_guide: "",
  forbidden: [],
});

const blankDefinition = (title: string): JobTestDefinition => ({
  id: "",
  job_title: title || "New Mock Test",
  department: null,
  status: "draft",
  syllabus: { sections: [] },
  sample_questions: {},
  difficulty_distribution: { easy: 40, medium: 40, hard: 20 },
  min_questions_per_topic: 1,
  max_retries: 2,
});

const MockTestEditor: React.FC<Props> = ({ isOpen, onOpenChange, test, onSaved }) => {
  const queryClient = useQueryClient();
  const isEditing = !!test;

  // Basic info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [organization, setOrganization] = useState("");
  const [duration, setDuration] = useState(90);
  const [questions, setQuestions] = useState(100);
  const [syllabusItems, setSyllabusItems] = useState<SyllabusItem[]>([{ topic: "", percentage: 0 }]);

  // Backing definition (rich authoring)
  const [def, setDef] = useState<JobTestDefinition>(blankDefinition(""));
  const [loadingDef, setLoadingDef] = useState(false);
  const [saving, setSaving] = useState(false);

  const [bulkJsonOpen, setBulkJsonOpen] = useState(false);
  const [bulkJsonText, setBulkJsonText] = useState("");

  // Load state whenever the dialog opens for a (new) test.
  useEffect(() => {
    if (!isOpen) return;
    if (test) {
      setTitle(test.title || "");
      setDescription(test.description || "");
      setOrganization(test.organization || "");
      setDuration(test.duration || 90);
      setQuestions(test.questions || 100);
      setSyllabusItems(
        test.syllabus && test.syllabus.length ? test.syllabus : [{ topic: "", percentage: 0 }],
      );
      if (test.definition_id) {
        setLoadingDef(true);
        getJobTestDefinition(test.definition_id)
          .then((d) => setDef(d || blankDefinition(test.title)))
          .finally(() => setLoadingDef(false));
      } else {
        setDef(blankDefinition(test.title));
      }
    } else {
      setTitle("");
      setDescription("");
      setOrganization("");
      setDuration(90);
      setQuestions(100);
      setSyllabusItems([{ topic: "", percentage: 0 }]);
      setDef(blankDefinition(""));
    }
  }, [isOpen, test]);

  const sections = def.syllabus?.sections || [];
  const subjectList = sections.map((s) => s.subject).filter(Boolean);

  // ---- Basic syllabus handlers ----
  const handleAddSyllabusItem = () => setSyllabusItems([...syllabusItems, { topic: "", percentage: 0 }]);
  const handleRemoveSyllabusItem = (index: number) =>
    setSyllabusItems(syllabusItems.filter((_, i) => i !== index));
  const handleSyllabusItemChange = (index: number, field: keyof SyllabusItem, value: string | number) => {
    const next = [...syllabusItems];
    if (field === "topic") next[index].topic = value as string;
    else if (field === "percentage") next[index].percentage = value as number;
    setSyllabusItems(next);
  };

  // ---- Definition section handlers ----
  const updateSection = (idx: number, patch: Partial<JobSyllabusSection>) => {
    const next = sections.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    setDef({ ...def, syllabus: { sections: next } });
  };
  const addSection = () => setDef({ ...def, syllabus: { sections: [...sections, emptySection()] } });
  const removeSection = (idx: number) =>
    setDef({ ...def, syllabus: { sections: sections.filter((_, i) => i !== idx) } });

  // ---- Combined JSON import / export ----
  const handleBulkImport = () => {
    try {
      const parsed = JSON.parse(bulkJsonText);
      // Basic info
      if (parsed.title) setTitle(parsed.title);
      if (parsed.description) setDescription(parsed.description);
      if (parsed.organization) setOrganization(parsed.organization);
      if (parsed.duration) setDuration(Number(parsed.duration));
      if (parsed.questions) setQuestions(Number(parsed.questions));
      if (Array.isArray(parsed.weighted_syllabus) && parsed.weighted_syllabus.length) {
        setSyllabusItems(
          parsed.weighted_syllabus.map((i: any) => ({
            topic: String(i.topic || ""),
            percentage: Number(i.percentage || 0),
          })),
        );
      }
      // Definition
      const nextDef: JobTestDefinition = { ...def };
      if (parsed.syllabus?.sections && Array.isArray(parsed.syllabus.sections)) {
        nextDef.syllabus = parsed.syllabus;
      }
      if (parsed.sample_questions && typeof parsed.sample_questions === "object") {
        nextDef.sample_questions = parsed.sample_questions;
      }
      if (parsed.department !== undefined) nextDef.department = parsed.department;
      if (parsed.difficulty_distribution) nextDef.difficulty_distribution = parsed.difficulty_distribution;
      setDef(nextDef);

      toast.success(
        `Imported test info + ${nextDef.syllabus?.sections?.length || 0} sections, ${
          Object.keys(nextDef.sample_questions || {}).length
        } sample subject(s)`,
      );
      setBulkJsonOpen(false);
      setBulkJsonText("");
    } catch (e: any) {
      toast.error(`Invalid JSON: ${e.message}`);
    }
  };

  const handleExport = () => {
    const exportData = {
      title,
      description,
      organization,
      duration,
      questions,
      weighted_syllabus: syllabusItems.filter((i) => i.topic),
      department: def.department,
      difficulty_distribution: def.difficulty_distribution,
      syllabus: def.syllabus,
      sample_questions: def.sample_questions,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "mock_test").replace(/\s+/g, "_")}_template.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported combined JSON");
  };

  // ---- Save (persists both job_tests row and backing definition) ----
  const persistDefinition = async (): Promise<string | null> => {
    const saved = await upsertJobTestDefinition({
      id: def.id || undefined,
      job_title: title || def.job_title || "Mock Test",
      department: def.department,
      status: def.status,
      syllabus: def.syllabus,
      sample_questions: def.sample_questions,
      difficulty_distribution: def.difficulty_distribution,
    } as any);
    if (saved) setDef(saved);
    return saved?.id ?? null;
  };

  const handleSave = async () => {
    if (!title || !description || !organization || !duration || !questions) {
      toast.error("Please fill out Title, Description, Organization, Duration and Questions");
      return;
    }
    const validSyllabusItems = syllabusItems.filter((i) => i.topic && i.percentage > 0);
    if (validSyllabusItems.length === 0) {
      toast.error("Please add at least one valid syllabus item in Basic Info");
      return;
    }
    const total = validSyllabusItems.reduce((s, i) => s + i.percentage, 0);
    if (total < 90 || total > 110) {
      toast.error(`Total syllabus percentage (${total}%) should be approximately 100%`);
      return;
    }

    setSaving(true);
    try {
      // Always back the mock test with a definition (auto-create on first save).
      const definitionId = await persistDefinition();
      if (!definitionId) {
        toast.error("Failed to save the test definition");
        return;
      }

      if (isEditing && test) {
        const updated = await updateJobTest({
          id: test.id,
          title,
          description,
          organization,
          duration,
          questions,
          syllabus: validSyllabusItems,
          definition_id: definitionId,
        });
        if (!updated) {
          toast.error("Failed to update mock test");
          return;
        }
        toast.success(`Mock test "${title}" updated`);
      } else {
        const added = await addJobTest({
          title,
          description,
          organization,
          duration,
          questions,
          syllabus: validSyllabusItems,
          definition_id: definitionId,
        });
        if (!added) {
          toast.error("Failed to add mock test");
          return;
        }
        toast.success(`Mock test "${title}" added`);
        toast.info("✨ Generating SEO with AI Magic…");
        enhanceJobTestSEO(added)
          .then((res) => {
            if (res) {
              queryClient.invalidateQueries({ queryKey: ["job-tests"] });
              toast.success("✨ SEO metadata generated");
            }
          })
          .catch(() => {});
      }

      queryClient.invalidateQueries({ queryKey: ["job-tests"] });
      queryClient.invalidateQueries({ queryKey: ["job-test-definitions"] });
      onSaved();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const canPublish = subjectList.every((s) => (def.sample_questions?.[s]?.length || 0) >= 2);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Mock Test" : "Add New Mock Test"}</DialogTitle>
          <DialogDescription>
            Everything for this mock test lives here — basic info, syllabus, samples and AI question
            generation.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => setBulkJsonOpen(true)}>
            <FileJson className="h-4 w-4 mr-1" /> Bulk Import JSON
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export JSON
          </Button>
        </div>

        {loadingDef ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading definition…
          </div>
        ) : (
          <Tabs defaultValue="basic" className="mt-2">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
              <TabsTrigger value="samples">Samples</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>

            {/* BASIC INFO */}
            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="grid gap-2">
                <label htmlFor="title" className="text-sm font-medium">Title</label>
                <Input
                  id="title"
                  placeholder="e.g., Election Officer (BPS-17)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this mock test"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="organization" className="text-sm font-medium">Organization</label>
                <Input
                  id="organization"
                  placeholder="e.g., Election Commission"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="duration" className="text-sm font-medium">Duration (minutes)</label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="questions" className="text-sm font-medium">Number of Questions</label>
                  <Input
                    id="questions"
                    type="number"
                    min="1"
                    value={questions}
                    onChange={(e) => setQuestions(Number(e.target.value))}
                  />
                </div>
              </div>
              <SyllabusItemForm
                syllabusItems={syllabusItems}
                onAdd={handleAddSyllabusItem}
                onRemove={handleRemoveSyllabusItem}
                onChange={handleSyllabusItemChange}
              />
            </TabsContent>

            {/* SYLLABUS (definition sections) */}
            <TabsContent value="syllabus" className="space-y-3 pt-4">
              <p className="text-xs text-muted-foreground">
                Detailed syllabus sections used by AI question generation (subjects, topics, weighting).
              </p>
              {sections.map((s, idx) => (
                <Card key={idx} className="p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Section #{idx + 1}</span>
                    <Button size="icon" variant="ghost" onClick={() => removeSection(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Subject"
                      value={s.subject}
                      onChange={(e) => updateSection(idx, { subject: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="% weight"
                      value={s.percentage || ""}
                      onChange={(e) => updateSection(idx, { percentage: Number(e.target.value) })}
                    />
                    <Input
                      type="number"
                      placeholder="Question count"
                      value={s.question_count || ""}
                      onChange={(e) => updateSection(idx, { question_count: Number(e.target.value) })}
                    />
                  </div>
                  <Textarea
                    placeholder="Topics (one per line)"
                    value={(s.topics || []).join("\n")}
                    onChange={(e) =>
                      updateSection(idx, {
                        topics: e.target.value.split("\n").map((t) => t.trim()).filter(Boolean),
                      })
                    }
                  />
                  <Textarea
                    placeholder="Style guide (optional)"
                    value={s.style_guide || ""}
                    onChange={(e) => updateSection(idx, { style_guide: e.target.value })}
                  />
                  <Textarea
                    placeholder="Forbidden content (one per line)"
                    value={(s.forbidden || []).join("\n")}
                    onChange={(e) =>
                      updateSection(idx, {
                        forbidden: e.target.value.split("\n").map((t) => t.trim()).filter(Boolean),
                      })
                    }
                  />
                </Card>
              ))}
              <Button variant="outline" size="sm" onClick={addSection}>
                <Plus className="h-4 w-4 mr-1" /> Add Section
              </Button>
            </TabsContent>

            {/* SAMPLES */}
            <TabsContent value="samples" className="pt-4">
              <SampleQuestionsEditor
                subjects={subjectList}
                samples={def.sample_questions || {}}
                onChange={(next) => setDef({ ...def, sample_questions: next })}
              />
            </TabsContent>

            {/* QUESTIONS */}
            <TabsContent value="questions" className="pt-4">
              {def.id ? (
                <GeneratedQuestionsTable jobTestId={def.id} sections={sections} />
              ) : (
                <div className="text-center text-sm text-muted-foreground py-10 border rounded-md bg-muted/10">
                  Save the mock test once to enable AI question generation.
                </div>
              )}
            </TabsContent>

            {/* LOGS */}
            <TabsContent value="logs" className="pt-4">
              {def.id ? (
                <GenerationLogsTable jobTestId={def.id} />
              ) : (
                <div className="text-center text-sm text-muted-foreground py-10 border rounded-md bg-muted/10">
                  Generation logs appear after you save and generate questions.
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving…
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Add Mock Test"
            )}
          </Button>
        </DialogFooter>

        {/* Combined Bulk Import dialog */}
        <Dialog open={bulkJsonOpen} onOpenChange={setBulkJsonOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Bulk Import JSON</DialogTitle>
              <DialogDescription>
                Paste one combined JSON covering basic info AND the definition. This replaces the
                current values.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={bulkJsonText}
              onChange={(e) => setBulkJsonText(e.target.value)}
              placeholder={`{
  "title": "Junior Clerk (BPS-11)",
  "description": "Official mock test for ...",
  "organization": "Office of the District & Sessions Judge",
  "duration": 90,
  "questions": 100,
  "weighted_syllabus": [
    { "topic": "English", "percentage": 40 },
    { "topic": "General Knowledge", "percentage": 60 }
  ],
  "department": "Judiciary",
  "difficulty_distribution": { "easy": 40, "medium": 40, "hard": 20 },
  "syllabus": {
    "sections": [
      {
        "subject": "English",
        "percentage": 40,
        "question_count": 40,
        "topics": ["Grammar", "Vocabulary"],
        "forbidden": ["No science"]
      }
    ]
  },
  "sample_questions": {
    "English": [
      {
        "question": "...",
        "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
        "correct_answer": "A",
        "explanation": "..."
      }
    ]
  }
}`}
              className="font-mono text-xs h-[400px]"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkJsonOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkImport} disabled={!bulkJsonText.trim()}>
                Import
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default MockTestEditor;
