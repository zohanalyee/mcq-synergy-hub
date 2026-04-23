import React, { useState } from "react";
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
import { Plus, Trash2, FileJson, Download } from "lucide-react";
import { toast } from "sonner";
import {
  JobTestDefinition,
  JobSyllabusSection,
  upsertJobTestDefinition,
} from "@/services/jobTestService";
import SampleQuestionsEditor from "./SampleQuestionsEditor";
import GeneratedQuestionsTable from "./GeneratedQuestionsTable";
import GenerationLogsTable from "./GenerationLogsTable";

interface Props {
  definition: JobTestDefinition;
  onSaved?: (def: JobTestDefinition) => void;
  onClose?: () => void;
}

const emptySection = (): JobSyllabusSection => ({
  subject: "",
  percentage: 0,
  question_count: 0,
  topics: [],
  style_guide: "",
  forbidden: [],
});

export const JobTestDefinitionEditor: React.FC<Props> = ({ definition, onSaved, onClose }) => {
  const [def, setDef] = useState<JobTestDefinition>(definition);
  const [saving, setSaving] = useState(false);
  const [bulkJsonOpen, setBulkJsonOpen] = useState(false);
  const [bulkJsonText, setBulkJsonText] = useState("");

  const sections = def.syllabus?.sections || [];

  const handleBulkImport = () => {
    try {
      const parsed = JSON.parse(bulkJsonText);
      if (!parsed.syllabus?.sections || !Array.isArray(parsed.syllabus.sections)) {
        throw new Error("Missing syllabus.sections array");
      }
      setDef({
        ...def,
        syllabus: parsed.syllabus,
        sample_questions: parsed.sample_questions || {},
      });
      toast.success(
        `Imported ${parsed.syllabus.sections.length} sections, ${
          Object.keys(parsed.sample_questions || {}).length
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
      syllabus: def.syllabus,
      sample_questions: def.sample_questions,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(def.job_title || "job_test").replace(/\s+/g, "_")}_template.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported JSON");
  };

  const updateSection = (idx: number, patch: Partial<JobSyllabusSection>) => {
    const next = sections.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    setDef({ ...def, syllabus: { sections: next } });
  };

  const addSection = () => {
    setDef({ ...def, syllabus: { sections: [...sections, emptySection()] } });
  };

  const removeSection = (idx: number) => {
    setDef({ ...def, syllabus: { sections: sections.filter((_, i) => i !== idx) } });
  };

  const handleSave = async () => {
    setSaving(true);
    const saved = await upsertJobTestDefinition({
      id: def.id,
      job_title: def.job_title,
      department: def.department,
      status: def.status,
      syllabus: def.syllabus,
      sample_questions: def.sample_questions,
      difficulty_distribution: def.difficulty_distribution,
    });
    setSaving(false);
    if (saved) {
      toast.success("Saved");
      setDef(saved);
      onSaved?.(saved);
    } else {
      toast.error("Failed to save");
    }
  };

  const subjectList = sections.map((s) => s.subject).filter(Boolean);

  const canPublish = subjectList.every(
    (s) => (def.sample_questions?.[s]?.length || 0) >= 2,
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{def.job_title || "New Job Test"}</h3>
        <div className="flex gap-2">
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="definition">
        <TabsList>
          <TabsTrigger value="definition">Definition</TabsTrigger>
          <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
          <TabsTrigger value="samples">Samples</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="definition" className="space-y-3 pt-4">
          <div>
            <label className="text-sm font-medium">Job title</label>
            <Input
              value={def.job_title}
              onChange={(e) => setDef({ ...def, job_title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Department</label>
            <Input
              value={def.department || ""}
              onChange={(e) => setDef({ ...def, department: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Status</label>
            <select
              className="block border rounded px-2 py-1 bg-background"
              value={def.status}
              onChange={(e) => setDef({ ...def, status: e.target.value as any })}
              disabled={def.status !== "published" && !canPublish}
            >
              <option value="draft">draft</option>
              <option value="published" disabled={!canPublish}>
                published {canPublish ? "" : "(need ≥2 samples per subject)"}
              </option>
              <option value="archived">archived</option>
            </select>
          </div>
        </TabsContent>

        <TabsContent value="syllabus" className="space-y-3 pt-4">
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
                placeholder="Forbidden content (one per line, e.g. 'No hardware (CPU, RAM, motherboard)')"
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

        <TabsContent value="samples" className="pt-4">
          <SampleQuestionsEditor
            subjects={subjectList}
            samples={def.sample_questions || {}}
            onChange={(next) => setDef({ ...def, sample_questions: next })}
          />
        </TabsContent>

        <TabsContent value="questions" className="pt-4">
          <GeneratedQuestionsTable jobTestId={def.id} sections={sections} />
        </TabsContent>

        <TabsContent value="logs" className="pt-4">
          <GenerationLogsTable jobTestId={def.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JobTestDefinitionEditor;
