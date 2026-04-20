import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, AlertTriangle, ShieldCheck, RefreshCw } from "lucide-react";

type CorruptionReason = string;

interface CorruptedItem {
  id: string;
  title: string;
  subject: string | null;
  topic: string | null;
  difficulty: string | null;
  options: any;
  correct_option: string | null;
  created_at: string;
  reasons: CorruptionReason[];
}

// ============= TOPIC MISMATCH KEYWORDS (mirrors edge-function guard) =============
const SCIENCE_KEYWORDS = [
  "gas", "liquid", "solid", "particles", "matter",
  "molecular", "amorphous", "crystalline", "atom", "molecule",
  "chemical", "element", "compound", "electron", "proton", "neutron",
];
const HARDWARE_KEYWORDS = [
  "cpu", "ram", "rom", "processor", "motherboard",
  "circuit", "transistor", "register", "alu", "gpu",
];
const MS_OFFICE_KEYWORDS = [
  "word", "excel", "powerpoint", "outlook", "spreadsheet",
  "formula", "slide", "cell reference", "mail merge", "pivot",
  "vlookup", "sum(", "average(", "ribbon", "workbook", "worksheet",
  "document", "paragraph", "shortcut", "ctrl+", "ctrl +",
];
const GK_MARKERS = [
  "pakistan", "capital", "founded", "prime minister", "president",
  "river", "mountain", "province", "year", "war", "treaty",
  "constitution", "jinnah", "iqbal", "partition", "independence",
  "organisation", "organization", "united nations", "islamic",
];

const hasAny = (text: string, words: string[]) => words.some((w) => text.includes(w));

const getTopicMismatchReasons = (item: any): CorruptionReason[] => {
  const reasons: CorruptionReason[] = [];
  const q = String(item.title || "").toLowerCase();
  const subject = String(item.subject || item.topic || "").toLowerCase();
  if (!q || !subject) return reasons;

  // Computer (MS Office) drift
  if (subject.includes("ms office") || subject.includes("msoffice") || /\bcomputer\b/.test(subject)) {
    if (hasAny(q, SCIENCE_KEYWORDS)) reasons.push("Science content in Computer");
    else if (hasAny(q, HARDWARE_KEYWORDS) && !hasAny(q, MS_OFFICE_KEYWORDS)) {
      reasons.push("Hardware content in Computer (MS Office)");
    }
  }

  // General Knowledge drift
  if (subject.includes("general knowledge") || subject === "gk" || subject.includes("(gk)")) {
    if (hasAny(q, SCIENCE_KEYWORDS) && !hasAny(q, GK_MARKERS)) {
      reasons.push("Science content in General Knowledge");
    }
  }

  return reasons;
};

const getCorruptionReasons = (item: any): CorruptionReason[] => {
  const reasons: CorruptionReason[] = [];
  const opts = item.options as any;

  // Title check
  if (!item.title || item.title.trim().length < 5) {
    reasons.push("Short/empty title");
  }

  // Options existence
  if (!opts) {
    reasons.push("No options");
    return reasons;
  }

  if (Array.isArray(opts)) {
    if (opts.length < 4) reasons.push(`Only ${opts.length} options`);
    if (opts.some((o: any) => !o || (typeof o === "string" && o.trim() === ""))) {
      reasons.push("Empty option string");
    }
  } else if (typeof opts === "object") {
    const keys = ["A", "B", "C", "D"];
    for (const k of keys) {
      if (!opts[k] || (typeof opts[k] === "string" && opts[k].trim() === "")) {
        reasons.push(`Option ${k} empty`);
      }
    }
  } else {
    reasons.push("Invalid options format");
  }

  // Correct option check
  if (!item.correct_option || (typeof item.correct_option === "string" && item.correct_option.trim() === "")) {
    reasons.push("No correct answer");
  }

  // Topic mismatch (Computer/GK serving Science questions)
  reasons.push(...getTopicMismatchReasons(item));

  return reasons;
};

const CorruptedDataCleaner = () => {
  const queryClient = useQueryClient();

  const { data: corrupted = [], isLoading, refetch } = useQuery({
    queryKey: ["corrupted-mcqs"],
    queryFn: async () => {
      // Two-pronged scan:
      // 1) Recent 500 MCQs (catches general corruption)
      // 2) ALL Computer/GK rows (catches the topic-mismatch hotfix scope)
      const [recentRes, targetedRes] = await Promise.all([
        supabase
          .from("content_items")
          .select("id, title, subject, topic, difficulty, options, correct_option, created_at")
          .eq("category", "mcq")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("content_items")
          .select("id, title, subject, topic, difficulty, options, correct_option, created_at")
          .eq("category", "mcq")
          .or(
            "subject.ilike.%computer%,subject.ilike.%ms office%,subject.ilike.%general knowledge%,topic.ilike.%computer%,topic.ilike.%ms office%,topic.ilike.%general knowledge%"
          )
          .limit(2000),
      ]);

      if (recentRes.error) throw recentRes.error;
      if (targetedRes.error) throw targetedRes.error;

      const merged = new Map<string, any>();
      for (const item of [...(recentRes.data || []), ...(targetedRes.data || [])]) {
        merged.set(item.id, item);
      }

      const results: CorruptedItem[] = [];
      for (const item of merged.values()) {
        const reasons = getCorruptionReasons(item);
        if (reasons.length > 0) {
          results.push({ ...item, reasons });
        }
      }
      // Newest first
      results.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      return results;
    },
  });

  const cleanupMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("content_items")
        .delete()
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      toast.success(`Deleted ${ids.length} corrupted questions`);
      queryClient.invalidateQueries({ queryKey: ["corrupted-mcqs"] });
    },
    onError: (err: any) => {
      toast.error("Cleanup failed: " + err.message);
    },
  });

  return (
    <Card className="border-border/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Corrupted MCQ Cleanup
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              Scan Again
            </Button>
            {corrupted.length > 0 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (confirm(`Delete ${corrupted.length} corrupted questions?`)) {
                    cleanupMutation.mutate(corrupted.map((q) => q.id));
                  }
                }}
                disabled={cleanupMutation.isPending}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clean All ({corrupted.length})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Scanning...</p>
        ) : corrupted.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-emerald-400 py-4 justify-center">
            <ShieldCheck className="h-4 w-4" />
            No corrupted questions found
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {corrupted.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/20"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.title || "No title"}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">
                      {item.subject || "?"}
                    </Badge>
                    {item.reasons.map((reason, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-[10px] text-red-400 border-red-500/30"
                      >
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 shrink-0 text-red-400 hover:text-red-300"
                  onClick={() => cleanupMutation.mutate([item.id])}
                  disabled={cleanupMutation.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CorruptedDataCleaner;
