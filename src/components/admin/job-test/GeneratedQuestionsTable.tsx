import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Trash2, Loader2, CheckCheck, X } from "lucide-react";
import { toast } from "sonner";
import {
  JobTestQuestion,
  JobSyllabusSection,
  getQuestionsForDefinition,
  setQuestionApproval,
  deleteJobTestQuestion,
  generateForSubject,
  bulkSetQuestionApproval,
  approveAllPendingForTest,
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const reload = async () => {
    setLoading(true);
    const data = await getQuestionsForDefinition(jobTestId);
    setQuestions(data);
    setSelected(new Set());
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, [jobTestId]);

  const filtered = useMemo(
    () =>
      questions.filter((q) => {
        if (filter === "pending" && q.admin_approved) return false;
        if (filter === "approved" && !q.admin_approved) return false;
        if (subjectFilter !== "all" && q.subject !== subjectFilter) return false;
        return true;
      }),
    [questions, filter, subjectFilter],
  );

  const pendingCount = useMemo(
    () => questions.filter((q) => !q.admin_approved).length,
    [questions],
  );

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((q) => selected.has(q.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((q) => q.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApprove = async (id: string, approved: boolean) => {
    const ok = await setQuestionApproval(id, approved);
    if (ok) {
      setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, admin_approved: approved } : q)));
    } else {
      toast.error("Failed to update approval");
    }
  };

  const handleBulk = async (approved: boolean) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkBusy(true);
    const ok = await bulkSetQuestionApproval(ids, approved);
    if (ok) {
      const idSet = new Set(ids);
      setQuestions((prev) =>
        prev.map((q) => (idSet.has(q.id) ? { ...q, admin_approved: approved } : q)),
      );
      setSelected(new Set());
      toast.success(`${ids.length} question${ids.length === 1 ? "" : "s"} ${approved ? "approved" : "unapproved"}`);
    } else {
      toast.error("Bulk update failed");
    }
    setBulkBusy(false);
  };

  const handleApproveAllPending = async () => {
    if (pendingCount === 0) {
      toast.info("No pending questions to approve.");
      return;
    }
    if (
      !window.confirm(
        `Approve ALL ${pendingCount} pending question${pendingCount === 1 ? "" : "s"} for this test?\n\nThey will become visible to players immediately.`,
      )
    )
      return;
    setBulkBusy(true);
    const r = await approveAllPendingForTest(jobTestId);
    if (r.success) {
      setQuestions((prev) => prev.map((q) => ({ ...q, admin_approved: true })));
      setSelected(new Set());
      toast.success(`Approved ${r.count} pending question${r.count === 1 ? "" : "s"}`);
    } else {
      toast.error("Failed to approve all pending");
    }
    setBulkBusy(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    const ok = await deleteJobTestQuestion(id);
    if (ok) {
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
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
        <Button
          size="sm"
          variant="outline"
          className="ml-auto gap-1.5"
          onClick={handleApproveAllPending}
          disabled={bulkBusy || pendingCount === 0}
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Approve all pending ({pendingCount})
        </Button>
      </div>

      {/* Select-all + bulk action bar */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={allFilteredSelected}
              onCheckedChange={toggleSelectAll}
              aria-label="Select all filtered questions"
            />
            Select all ({filtered.length})
          </label>
          {selected.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">{selected.size} selected</span>
              <Button size="sm" onClick={() => handleBulk(true)} disabled={bulkBusy} className="gap-1.5">
                {bulkBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Approve selected
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulk(false)} disabled={bulkBusy}>
                Unapprove selected
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} className="gap-1">
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            </>
          )}
        </div>
      )}

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
            <Card
              key={q.id}
              className={selected.has(q.id) ? "p-3 space-y-2 ring-2 ring-primary/40" : "p-3 space-y-2"}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1">
                  <Checkbox
                    checked={selected.has(q.id)}
                    onCheckedChange={() => toggleOne(q.id)}
                    className="mt-0.5"
                    aria-label="Select question"
                  />
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
              <div className="grid grid-cols-2 gap-1 text-xs pl-6">
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
                <p className="text-xs text-muted-foreground pl-6">{q.explanation}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GeneratedQuestionsTable;
