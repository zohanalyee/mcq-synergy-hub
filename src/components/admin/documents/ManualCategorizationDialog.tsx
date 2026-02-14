import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ChunkPreview {
  index: number;
  content: string;
  preview: string;
}

interface AIMetadata {
  system: string;
  level: string;
  subject: string;
  topic: string;
  confidence: number;
  reasoning?: string;
}

interface LMSOption {
  id: string;
  name: string;
}

interface ManualCategorizationDialogProps {
  open: boolean;
  onClose: () => void;
  filename: string;
  aiMetadata: AIMetadata;
  chunks: ChunkPreview[];
  documentId: string;
  onConfirm: (correctedMetadata: AIMetadata) => void;
}

export function ManualCategorizationDialog({
  open,
  onClose,
  filename,
  aiMetadata,
  chunks,
  documentId,
  onConfirm,
}: ManualCategorizationDialogProps) {
  const [system, setSystem] = useState(aiMetadata.system);
  const [level, setLevel] = useState(aiMetadata.level);
  const [subject, setSubject] = useState(aiMetadata.subject);
  const [topic, setTopic] = useState(aiMetadata.topic);
  const [saving, setSaving] = useState(false);

  const [systems, setSystems] = useState<LMSOption[]>([]);
  const [levels, setLevels] = useState<LMSOption[]>([]);
  const [subjects, setSubjects] = useState<LMSOption[]>([]);

  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const [selectedLevelId, setSelectedLevelId] = useState<string>("");

  // Load systems on mount
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("educational_systems")
        .select("id, name")
        .order("name");
      setSystems(data || []);
    };
    if (open) load();
  }, [open]);

  // Load levels when system changes
  useEffect(() => {
    if (!selectedSystemId) {
      setLevels([]);
      return;
    }
    const load = async () => {
      const { data } = await supabase
        .from("levels")
        .select("id, name")
        .eq("system_id", selectedSystemId)
        .order("order_index");
      setLevels(data || []);
    };
    load();
  }, [selectedSystemId]);

  // Load subjects when level changes
  useEffect(() => {
    if (!selectedLevelId) {
      setSubjects([]);
      return;
    }
    const load = async () => {
      const { data } = await supabase
        .from("subjects")
        .select("id, name")
        .eq("level_id", selectedLevelId)
        .order("name");
      setSubjects(data || []);
    };
    load();
  }, [selectedLevelId]);

  const handleSystemChange = (value: string) => {
    const found = systems.find((s) => s.id === value);
    setSelectedSystemId(value);
    setSystem(found?.name || value);
    setSelectedLevelId("");
    setLevel("");
    setSubject("");
  };

  const handleLevelChange = (value: string) => {
    const found = levels.find((l) => l.id === value);
    setSelectedLevelId(value);
    setLevel(found?.name || value);
    setSubject("");
  };

  const handleSubjectChange = (value: string) => {
    const found = subjects.find((s) => s.id === value);
    setSubject(found?.name || value);
  };

  const handleConfirm = async () => {
    if (!system || !level || !subject || !topic) return;
    setSaving(true);
    onConfirm({
      system,
      level,
      subject,
      topic,
      confidence: 1.0,
      reasoning: "Admin manually categorized based on content review",
    });
    setSaving(false);
  };

  const isUnknown = (val: string) =>
    !val || val === "Unknown" || val === "unknown";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Fix Categorization: {filename}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* AI Detection Summary */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Detected:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {(["system", "level", "subject", "topic"] as const).map((key) => (
                <div key={key}>
                  <span className="text-muted-foreground capitalize">
                    {key}:
                  </span>{" "}
                  <Badge
                    variant={
                      isUnknown(aiMetadata[key]) ? "destructive" : "secondary"
                    }
                  >
                    {aiMetadata[key]}
                  </Badge>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground italic">
              Confidence: {(aiMetadata.confidence * 100).toFixed(0)}%
              {aiMetadata.reasoning && ` • ${aiMetadata.reasoning}`}
            </p>
          </div>

          {/* Content Preview */}
          {chunks.length > 0 && (
            <div>
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                Content Preview ({chunks.length} chunks):
              </h4>
              <ScrollArea className="h-[160px] border rounded-lg p-3">
                {chunks.slice(0, 3).map((chunk) => (
                  <div
                    key={chunk.index}
                    className="mb-3 pb-3 border-b last:border-0"
                  >
                    <Badge variant="outline" className="mb-1 text-xs">
                      Chunk {chunk.index + 1}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {chunk.preview}
                    </p>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          {/* Manual Selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Correct Categorization:</h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">System (Board)</Label>
                <Select
                  value={selectedSystemId}
                  onValueChange={handleSystemChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select system" />
                  </SelectTrigger>
                  <SelectContent>
                    {systems.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Level (Class)</Label>
                <Select
                  value={selectedLevelId}
                  onValueChange={handleLevelChange}
                  disabled={!selectedSystemId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Subject</Label>
                <Select
                  onValueChange={handleSubjectChange}
                  disabled={!selectedLevelId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Topic</Label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter topic/chapter name"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              saving || !system || !level || !subject || !topic
            }
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Confirm & Re-link"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
