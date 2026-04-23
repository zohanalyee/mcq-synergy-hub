import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  JobTestQuestion,
  JobSyllabusSection,
  getQuestionsForDefinition,
  setQuestionApproval,
  deleteJobTestQuestion,
  generateForSubject,
} from "@/services/jobTestService";

interface Props {
  jobTestId: string;
  sections: JobSyllabusSection[];
}

export const GeneratedQuestionsTable: React.FC<Props> = ({ jobTestId, sections }) => {
  const [questions, setQuestions] = useState<JobTestQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  const reload = async () => {
    setLoading(true);
    const data = await getQuestionsForDefinition(jobTestId);
    setQuestions(data);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, [jobTestId]);

  const filtered = questions.filter((q) => {
    if (filter === "pending" && q.admin_approved) return false;
    if (filter === "approved" && !q.admin_approved) return false;
    if (subjectFilter !== "all" && q.subject !== subjectFilter) return false;
    return true;
  });

  const handleApprove = async (id: string, approved: boolean) => {
    const ok = await setQuestionApproval(id, approved);
    if (ok) {
      setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, admin_approved: approved } : q)));
    } else {
      toast.error("Failed to update approval");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    const ok = await deleteJobTestQuestion(id);
    if (ok) setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleGenerate = async (subject: string) => {
    setGeneratingFor(subject);
    toast.info(`Generating questions for ${subject}…`);
    const r = await generateForSubject(jobTestId, subject);
    if (r.success) {
      toast.success(`Generated. Reload to view.`);
      await reload();
    } else {
      toast.error(r.message);
    }
    setGeneratingFor(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium">Filter:</span>
        {(["all", "pending", "approved"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
          >
            {f}
          </Button>
        ))}
        <select
          className="border rounded px-2 py-1 bg-background text-sm ml-2"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
        >
          <option value="all">All subjects</option>
          {sections.map((s) => (
            <option key={s.subject} value={s.subject}>
              {s.subject}
            </option>
          ))}
        </select>
        <Button size="sm" variant="outline" onClick={reload}>
          Reload
        </Button>
      </div>

      <Card className="p-3">
        <p className="text-sm font-medium mb-2">Generate per subject</p>
        <div className="flex flex-wrap gap-2">
          {sections.map((s) => (
            <Button
              key={s.subject}
              size="sm"
              variant="outline"
              disabled={generatingFor !== null}
              onClick={() => handleGenerate(s.subject)}
            >
              {generatingFor === s.subject ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : null}
              {s.subject} (target {s.question_count})
            </Button>
          ))}
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No questions yet.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((q) => (
            <Card key={q.id} className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex gap-2 mb-1">
                    <Badge variant="outline">{q.subject}</Badge>
                    <Badge variant={q.admin_approved ? "default" : "secondary"}>
                      {q.admin_approved ? "approved" : "pending"}
                    </Badge>
                    <Badge variant="outline">{q.difficulty}</Badge>
                  </div>
                  <p className="font-medium text-sm">{q.question}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant={q.admin_approved ? "secondary" : "default"}
                    onClick={() => handleApprove(q.id, !q.admin_approved)}
                    title={q.admin_approved ? "Unapprove" : "Approve"}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(q.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {Object.entries(q.options).map(([k, v]) => (
                  <div
                    key={k}
                    className={k === q.correct_answer ? "text-green-600 font-medium" : ""}
                  >
                    {k}. {v}
                  </div>
                ))}
              </div>
              {q.explanation && (
                <p className="text-xs text-muted-foreground">{q.explanation}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GeneratedQuestionsTable;
