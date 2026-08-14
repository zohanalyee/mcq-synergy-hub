import { useEffect, useState } from "react";
import { Rocket, ShieldCheck, RefreshCw, Play, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  getSprintConfig,
  updateSprintConfig,
  getRecentAutoFillRuns,
  getQualityGateStats,
  runQualityGate,
  previewSprintScope,
  type SprintConfig,
  type RunSummary,
  type SprintScopePreview,
} from "@/services/autoFillService";


const PRESETS = [
  { label: "MDCAT", keywords: ["mdcat"] },
  { label: "Punjab + Sindh Boards", keywords: ["punjab", "sindh"] },
  { label: "PPSC / FPSC / NTS", keywords: ["ppsc", "fpsc", "nts"] },
  { label: "Entry Tests", keywords: ["ecat", "nust", "comsats"] },
  { label: "Forces", keywords: ["army", "paf", "navy"] },
];

const SprintModePanel = () => {
  const [config, setConfig] = useState<SprintConfig | null>(null);
  const [keywordText, setKeywordText] = useState("");
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [quality, setQuality] = useState<{ unverified: number; flagged: number; lastRun: RunSummary | null } | null>(null);
  const [scope, setScope] = useState<SprintScopePreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const refreshScope = async (keywords: string[]) => {
    setIsPreviewing(true);
    try {
      setScope(await previewSprintScope(keywords));
    } finally {
      setIsPreviewing(false);
    }
  };

  const load = async () => {
    setIsLoading(true);
    try {
      const [cfg, recentRuns, qStats] = await Promise.all([
        getSprintConfig(),
        getRecentAutoFillRuns(8),
        getQualityGateStats(),
      ]);
      setConfig(cfg);
      setKeywordText((cfg?.scope_keywords || []).join(", "));
      setRuns(recentRuns);
      setQuality(qStats);
      refreshScope(cfg?.scope_keywords || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (patch: Partial<SprintConfig>) => {
    setIsSaving(true);
    const ok = await updateSprintConfig(patch);
    setIsSaving(false);
    if (!ok) {
      toast.error("Could not save sprint settings");
      return;
    }
    setConfig((prev) => (prev ? { ...prev, ...patch } as SprintConfig : prev));
    toast.success("Sprint settings saved");
  };

  // Safety: never save a scope silently when it targets zero queued topics —
  // that is what made earlier sprint runs stop with "no topics match".
  const saveKeywords = async (keywords: string[]) => {
    const preview = await previewSprintScope(keywords);
    setScope(preview);
    if (preview.total === 0) {
      toast.error("This scope matches 0 queued topics", {
        description: "Sprint runs would stop immediately. Pick different keywords before saving.",
      });
      return;
    }
    await save({ scope_keywords: keywords });
    toast.message(`Scope covers ${preview.total} topics needing questions`);
  };

  const applyKeywords = () => {
    const keywords = keywordText
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 1);
    saveKeywords(keywords);
  };


  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const result = await runQualityGate(3);
      if (!result.success) {
        toast.error(result.error || "Quality gate failed");
        return;
      }
      toast.success(`Reviewed ${result.reviewed} questions`, {
        description: `${result.flagged} flagged for admin review. ${result.stop_reason || ""}`,
      });
      load();
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Phase 3: Sprint mode */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            Content Fill Sprint
            {config?.enabled && <Badge className="ml-1">Active</Badge>}
          </CardTitle>
          <CardDescription>
            Focus every auto-fill run on a priority scope with its own per-topic target and daily budget.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="sprint-enabled" className="text-sm">Sprint mode</Label>
            <Switch
              id="sprint-enabled"
              checked={!!config?.enabled}
              disabled={isSaving}
              onCheckedChange={(v) => save({ enabled: v })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Priority keywords (comma separated)</Label>
            <div className="flex gap-2">
              <Input
                value={keywordText}
                placeholder="mdcat, punjab, ppsc"
                onChange={(e) => setKeywordText(e.target.value)}
                className="min-h-11"
              />
              <Button variant="outline" onClick={applyKeywords} disabled={isSaving} className="min-h-11">
                Apply
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  size="sm"
                  variant="secondary"
                  className="min-h-9"
                  onClick={() => {
                    setKeywordText(p.keywords.join(", "));
                    save({ scope_keywords: p.keywords });
                  }}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Target / topic</Label>
              <Input
                type="number"
                min={5}
                max={20}
                className="min-h-11"
                value={config?.target_per_topic ?? 15}
                onChange={(e) => setConfig((p) => (p ? { ...p, target_per_topic: Number(e.target.value) } : p))}
                onBlur={(e) => save({ target_per_topic: Math.min(20, Math.max(5, Number(e.target.value) || 15)) })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Daily budget (questions)</Label>
              <Input
                type="number"
                min={10}
                max={1500}
                className="min-h-11"
                value={config?.daily_budget ?? 600}
                onChange={(e) => setConfig((p) => (p ? { ...p, daily_budget: Number(e.target.value) } : p))}
                onBlur={(e) => save({ daily_budget: Math.min(1500, Math.max(10, Number(e.target.value) || 600)) })}
              />
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Recent runs</Label>
              <Button size="sm" variant="ghost" onClick={load} className="min-h-9">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {runs.length === 0 && (
                <p className="text-xs text-muted-foreground">No runs logged yet.</p>
              )}
              {runs.map((run) => (
                <div key={run.id} className="flex items-center justify-between rounded-md border border-border/60 px-2.5 py-2 text-xs">
                  <div className="flex flex-col">
                    <span className="font-medium">{run.questions_saved} questions</span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                      {run.metadata?.sprint_mode ? " · sprint" : ""}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-right max-w-[45%] truncate">
                    {run.metadata?.stop_reason || "completed"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase 4: Quality gate */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Quality Gate
          </CardTitle>
          <CardDescription>
            Second-pass AI review of generated questions. Defective items move to pending for admin review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Awaiting review</p>
              <p className="text-xl font-bold">{quality?.unverified ?? 0}</p>
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Flagged (pending)</p>
              <p className="text-xl font-bold">{quality?.flagged ?? 0}</p>
            </div>
          </div>

          {quality?.lastRun && (
            <p className="text-xs text-muted-foreground">
              Last run {formatDistanceToNow(new Date(quality.lastRun.created_at), { addSuffix: true })} ·
              {" "}reviewed {quality.lastRun.metadata?.reviewed ?? 0}, flagged {quality.lastRun.metadata?.flagged ?? 0}
            </p>
          )}

          <Button className="w-full gap-2 min-h-11" onClick={handleVerify} disabled={isVerifying}>
            {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {isVerifying ? "Reviewing..." : "Review next 60 questions"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Runs 3 batches of 20 per click on the free Gemini tier, so review cost stays at zero.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SprintModePanel;
