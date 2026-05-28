import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Sparkles, Loader2, Database, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { BLOG_PRESETS } from "../blogPresets";

export interface GeneratedDraft {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  meta_title: string;
  meta_description: string;
}

interface Props {
  onApplyDraft: (draft: GeneratedDraft) => void;
}

interface SourceRow {
  id: string;
  table: "external_opportunities" | "content_items";
  title: string;
  type: string;
}

const AIGeneratePanel = ({ onApplyDraft }: Props) => {
  const [path, setPath] = useState<"content" | "prompt">("content");
  const [sourceType, setSourceType] = useState<"job" | "scholarship">("job");
  const [selectedSourceKey, setSelectedSourceKey] = useState<string>("");
  const [angle, setAngle] = useState("");
  const [presetId, setPresetId] = useState<string>(BLOG_PRESETS[0].id);
  const [customInstructions, setCustomInstructions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: sources = [], isLoading: loadingSources } = useQuery({
    queryKey: ["blog-ai-sources", sourceType],
    queryFn: async (): Promise<SourceRow[]> => {
      const [extRes, ciRes] = await Promise.all([
        supabase
          .from("external_opportunities")
          .select("id, title, type")
          .eq("type", sourceType)
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("content_items")
          .select("id, title, category")
          .eq("category", sourceType)
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      const ext: SourceRow[] = (extRes.data || []).map((r: any) => ({
        id: r.id,
        table: "external_opportunities",
        title: r.title,
        type: r.type,
      }));
      const ci: SourceRow[] = (ciRes.data || []).map((r: any) => ({
        id: r.id,
        table: "content_items",
        title: r.title,
        type: r.category,
      }));
      return [...ext, ...ci];
    },
  });

  const presetsByCategory = useMemo(() => {
    const grouped: Record<string, typeof BLOG_PRESETS> = {};
    for (const p of BLOG_PRESETS) {
      (grouped[p.category] ||= []).push(p);
    }
    return grouped;
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      let payload: any;

      if (path === "content") {
        if (!selectedSourceKey) {
          toast.error("Please select a source item");
          return;
        }
        const [table, id] = selectedSourceKey.split("::");
        payload = {
          mode: "from_content",
          source_table: table,
          source_id: id,
          angle: angle.trim() || undefined,
        };
      } else {
        const preset = BLOG_PRESETS.find((p) => p.id === presetId);
        if (!preset && !customInstructions.trim()) {
          toast.error("Pick a preset or enter custom instructions");
          return;
        }
        payload = {
          mode: "from_prompt",
          preset_topic: preset?.instruction,
          custom_instructions: customInstructions.trim() || undefined,
        };
      }

      const { data, error } = await supabase.functions.invoke("generate-blog", { body: payload });
      if (error) throw error;
      if (!data?.draft) throw new Error("No draft returned");

      onApplyDraft(data.draft as GeneratedDraft);
      toast.success(`Draft generated via ${data.provider}. Review and publish.`);
    } catch (e: any) {
      console.error("[AIGeneratePanel] generate failed:", e);
      toast.error(e?.message || "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="p-4 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Zero-Touch AI Generator</h3>
      </div>

      <Tabs value={path} onValueChange={(v) => setPath(v as any)} className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="content">
            <Database className="h-3.5 w-3.5 mr-1.5" />
            From Existing Content
          </TabsTrigger>
          <TabsTrigger value="prompt">
            <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
            From Admin Instructions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-3 pt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Source Type</Label>
              <select
                className="w-full mt-1 h-9 rounded-md border bg-background px-2 text-sm"
                value={sourceType}
                onChange={(e) => {
                  setSourceType(e.target.value as any);
                  setSelectedSourceKey("");
                }}
              >
                <option value="job">Jobs</option>
                <option value="scholarship">Scholarships</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Select Item ({loadingSources ? "loading…" : `${sources.length} found`})</Label>
              <select
                className="w-full mt-1 h-9 rounded-md border bg-background px-2 text-sm"
                value={selectedSourceKey}
                onChange={(e) => setSelectedSourceKey(e.target.value)}
                disabled={loadingSources || sources.length === 0}
              >
                <option value="">— pick a {sourceType} —</option>
                {sources.map((s) => (
                  <option key={`${s.table}::${s.id}`} value={`${s.table}::${s.id}`}>
                    {s.title.substring(0, 90)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Optional angle / focus</Label>
            <Input
              placeholder="e.g. eligibility focus, step-by-step apply guide"
              value={angle}
              onChange={(e) => setAngle(e.target.value)}
              className="mt-1"
            />
          </div>
        </TabsContent>

        <TabsContent value="prompt" className="space-y-3 pt-3">
          <div>
            <Label className="text-xs">Pre-defined Topic</Label>
            <select
              className="w-full mt-1 h-9 rounded-md border bg-background px-2 text-sm"
              value={presetId}
              onChange={(e) => setPresetId(e.target.value)}
            >
              {Object.entries(presetsByCategory).map(([cat, items]) => (
                <optgroup key={cat} label={cat}>
                  {items.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">Custom instructions (optional, appended)</Label>
            <Textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              rows={3}
              placeholder="Add specific angle, audience, or facts you want included"
              className="mt-1"
            />
          </div>
        </TabsContent>
      </Tabs>

      <Button onClick={handleGenerate} disabled={isGenerating} className="w-full mt-4">
        {isGenerating ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating draft…</>
        ) : (
          <><Sparkles className="h-4 w-4 mr-2" />Generate & Auto-Fill Form</>
        )}
      </Button>
      <p className="text-xs text-muted-foreground mt-2">
        The AI fills every field below. You only review and click Save / Publish.
      </p>
    </Card>
  );
};

export default AIGeneratePanel;
