import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link2, Plus, Ban } from "lucide-react";
import { JobTestDefinition } from "@/services/jobTestService";

export type DefinitionMode = "skip" | "link" | "create";

interface DefinitionLinkFieldProps {
  definitions: JobTestDefinition[];
  mode: DefinitionMode;
  setMode: (m: DefinitionMode) => void;
  definitionId: string | null;
  setDefinitionId: (id: string | null) => void;
}

/**
 * Connects a Mock Test to the richer "Job Test Definition" workflow.
 *  - Skip:   keep this as a standalone legacy test (no linked pool).
 *  - Link:   point at an existing Definition (its syllabus/sample/question pool).
 *  - Create: a fresh draft Definition is created and linked on save.
 */
const DefinitionLinkField = ({
  definitions,
  mode,
  setMode,
  definitionId,
  setDefinitionId,
}: DefinitionLinkFieldProps) => {
  const options: { value: DefinitionMode; label: string; icon: React.ReactNode }[] = [
    { value: "skip", label: "Skip", icon: <Ban className="h-4 w-4" /> },
    { value: "link", label: "Link existing", icon: <Link2 className="h-4 w-4" /> },
    { value: "create", label: "Create new", icon: <Plus className="h-4 w-4" /> },
  ];

  return (
    <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
      <div className="grid gap-1">
        <Label className="text-sm font-medium">Job Test Definition</Label>
        <p className="text-xs text-muted-foreground">
          Connect this mock test to the rich syllabus / sample / AI question-pool workflow.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => {
          const active = mode === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setMode(opt.value);
                if (opt.value !== "link") setDefinitionId(null);
              }}
              className={`flex flex-col items-center justify-center gap-1 rounded-md border p-2 text-xs font-medium transition-colors ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          );
        })}
      </div>

      {mode === "link" && (
        <Select
          value={definitionId ?? undefined}
          onValueChange={(v) => setDefinitionId(v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a definition to link…" />
          </SelectTrigger>
          <SelectContent>
            {definitions.length === 0 ? (
              <SelectItem value="__none__" disabled>
                No definitions available
              </SelectItem>
            ) : (
              definitions.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.job_title} ({d.status})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}

      {mode === "create" && (
        <p className="text-xs text-muted-foreground">
          A new draft Definition named after this test's title will be created and linked. You can
          curate its syllabus, samples and questions afterwards in the Definitions section.
        </p>
      )}
    </div>
  );
};

export default DefinitionLinkField;
