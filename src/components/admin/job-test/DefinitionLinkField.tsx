import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Link2, Plus, Ban } from "lucide-react";
import { JobTestDefinition } from "@/services/jobTestService";

export type DefinitionMode = "skip" | "link" | "create";

interface DefinitionLinkFieldProps {
  definitions: JobTestDefinition[];
  mode: DefinitionMode;
  setMode: (m: DefinitionMode) => void;
  definitionId: string | null;
  setDefinitionId: (id: string | null) => void;
  /** Title to prefill a newly-created definition (the mock test's title). */
  newDefinitionTitle: string;
  setNewDefinitionTitle: (t: string) => void;
}

/**
 * Connects a Mock Test to the richer "Job Test Definition" workflow.
 *  - Skip:   keep this as a standalone legacy test (no linked pool).
 *  - Link:   point at an existing Definition (its syllabus/sample/question pool).
 *  - Create: a fresh draft Definition is created and linked on save.
 *
 * NOTE: This lives inside a Radix Dialog, so we use a NATIVE <select> here.
 * The Radix Select component has known pointer-event / z-index conflicts
 * inside Dialogs (see project memory: "Dialog Form Select Constraints").
 */
const DefinitionLinkField = ({
  definitions,
  mode,
  setMode,
  definitionId,
  setDefinitionId,
  newDefinitionTitle,
  setNewDefinitionTitle,
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
        <div className="grid gap-1">
          <select
            value={definitionId ?? ""}
            onChange={(e) => setDefinitionId(e.target.value || null)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Select a definition to link…</option>
            {definitions.length === 0 ? (
              <option value="" disabled>
                No definitions available
              </option>
            ) : (
              definitions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.job_title}
                  {d.department ? ` · ${d.department}` : ""} ({d.status})
                </option>
              ))
            )}
          </select>
          <p className="text-xs text-muted-foreground">
            {definitions.length} definition{definitions.length === 1 ? "" : "s"} available.
          </p>
        </div>
      )}

      {mode === "create" && (
        <div className="grid gap-2">
          <Label htmlFor="new-def-title" className="text-xs font-medium">
            New definition title
          </Label>
          <Input
            id="new-def-title"
            value={newDefinitionTitle}
            onChange={(e) => setNewDefinitionTitle(e.target.value)}
            placeholder="Name for the new Job Test Definition"
          />
          <p className="text-xs text-muted-foreground">
            A new <span className="font-medium">draft</span> Definition with this title will be
            created and linked on save. Curate its syllabus, samples and questions afterwards in the
            Definitions section.
          </p>
        </div>
      )}
    </div>
  );
};

export default DefinitionLinkField;
