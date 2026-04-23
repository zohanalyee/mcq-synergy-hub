import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { JobSampleQuestion } from "@/services/jobTestService";

interface Props {
  subjects: string[];
  samples: Record<string, JobSampleQuestion[]>;
  onChange: (next: Record<string, JobSampleQuestion[]>) => void;
}

const emptyQ = (): JobSampleQuestion => ({
  question: "",
  options: { A: "", B: "", C: "", D: "" },
  correct_answer: "A",
  explanation: "",
});

export const SampleQuestionsEditor: React.FC<Props> = ({ subjects, samples, onChange }) => {
  const [activeSubject, setActiveSubject] = useState<string>(subjects[0] || "");

  const list = samples[activeSubject] || [];

  const update = (next: JobSampleQuestion[]) => {
    onChange({ ...samples, [activeSubject]: next });
  };

  const add = () => update([...list, emptyQ()]);
  const remove = (idx: number) => update(list.filter((_, i) => i !== idx));

  const patch = (idx: number, partial: Partial<JobSampleQuestion>) => {
    update(list.map((q, i) => (i === idx ? { ...q, ...partial } : q)));
  };

  if (subjects.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add syllabus sections first to attach sample questions.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {subjects.map((s) => (
          <Button
            key={s}
            variant={s === activeSubject ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSubject(s)}
          >
            {s} ({(samples[s] || []).length})
          </Button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Provide ≥2 sample MCQs per subject. The AI will mimic their style and difficulty.
      </p>

      <div className="space-y-3">
        {list.map((q, idx) => (
          <Card key={idx} className="p-4 space-y-3">
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Sample #{idx + 1}
              </span>
              <Button variant="ghost" size="icon" onClick={() => remove(idx)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              placeholder="Question text"
              value={q.question}
              onChange={(e) => patch(idx, { question: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              {(["A", "B", "C", "D"] as const).map((k) => (
                <Input
                  key={k}
                  placeholder={`Option ${k}`}
                  value={q.options[k] || ""}
                  onChange={(e) =>
                    patch(idx, { options: { ...q.options, [k]: e.target.value } })
                  }
                />
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-sm">Correct:</label>
              <select
                className="border rounded px-2 py-1 bg-background text-sm"
                value={q.correct_answer}
                onChange={(e) => patch(idx, { correct_answer: e.target.value })}
              >
                {["A", "B", "C", "D"].map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <Textarea
              placeholder="Explanation"
              value={q.explanation || ""}
              onChange={(e) => patch(idx, { explanation: e.target.value })}
            />
          </Card>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={add}>
        <Plus className="h-4 w-4 mr-1" /> Add Sample
      </Button>
    </div>
  );
};

export default SampleQuestionsEditor;
