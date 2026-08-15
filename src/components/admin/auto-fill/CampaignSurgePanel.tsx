import { useEffect, useState } from "react";
import { Rocket, Save, RefreshCw, History } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  getCampaignSurge,
  updateCampaignSurge,
  isSurgeActive,
  getPoolScalingEvents,
  type CampaignSurgeConfig,
  type PoolScalingEvent,
} from "@/services/jobTestService";

/** Local datetime value for <input type="datetime-local"> from an ISO string. */
const toLocalInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

/**
 * Campaign Surge window — time-boxed content budget boost (e.g. the Larkana
 * library banner week). Pre-configured and OFF by default: launch day is just a
 * toggle plus two dates, no new deploy needed. Auto-expires at the end date.
 */
const CampaignSurgePanel = () => {
  const [cfg, setCfg] = useState<CampaignSurgeConfig | null>(null);
  const [events, setEvents] = useState<PoolScalingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    setIsLoading(true);
    const [c, e] = await Promise.all([getCampaignSurge(), getPoolScalingEvents(8)]);
    setCfg(c || { enabled: false });
    setEvents(e);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const patch = (p: Partial<CampaignSurgeConfig>) => setCfg((prev) => ({ ...(prev || { enabled: false }), ...p }));

  const save = async () => {
    if (!cfg) return;
    setIsSaving(true);
    const ok = await updateCampaignSurge(cfg);
    setIsSaving(false);
    if (ok) {
      toast.success(
        cfg.enabled ? "Campaign surge saved and armed" : "Campaign surge saved (currently off)",
      );
      load();
    } else {
      toast.error("Could not save campaign surge settings");
    }
  };

  const active = isSurgeActive(cfg);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary" />
              Campaign Surge Window
            </CardTitle>
            <CardDescription className="text-xs">
              Temporarily raises the daily generation budget and floors every mock test's pool
              multiplier, so a content buffer is ready before an offline campaign spike. Expires
              automatically at the end date.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {active ? (
              <Badge className="bg-primary/15 text-primary border border-primary/30" variant="outline">
                Active
              </Badge>
            ) : (
              <Badge variant="secondary">{cfg?.enabled ? "Armed (outside window)" : "Off"}</Badge>
            )}
            <Button variant="outline" size="sm" onClick={load} className="gap-2 min-h-11">
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card/50 p-3">
          <div>
            <p className="text-sm font-medium">Enable surge</p>
            <p className="text-xs text-muted-foreground">
              Turn on when the banner goes live — nothing else needs redeploying.
            </p>
          </div>
          <Switch
            checked={!!cfg?.enabled}
            onCheckedChange={(v) => patch({ enabled: v })}
            aria-label="Enable campaign surge"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="surge-label" className="text-xs">Campaign label</Label>
            <Input
              id="surge-label"
              value={cfg?.label || ""}
              onChange={(e) => patch({ label: e.target.value })}
              placeholder="Larkana Library Banner"
              className="min-h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="surge-budget" className="text-xs">Daily question budget</Label>
            <Input
              id="surge-budget"
              type="number"
              min={100}
              max={1500}
              value={cfg?.daily_budget ?? 1200}
              onChange={(e) => patch({ daily_budget: Number(e.target.value) })}
              className="min-h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="surge-start" className="text-xs">Starts (local time)</Label>
            <Input
              id="surge-start"
              type="datetime-local"
              value={toLocalInput(cfg?.starts_at)}
              onChange={(e) => patch({ starts_at: fromLocalInput(e.target.value) })}
              className="min-h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="surge-end" className="text-xs">Ends (local time)</Label>
            <Input
              id="surge-end"
              type="datetime-local"
              value={toLocalInput(cfg?.ends_at)}
              onChange={(e) => patch({ ends_at: fromLocalInput(e.target.value) })}
              className="min-h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="surge-mult" className="text-xs">Minimum pool multiplier</Label>
            <Input
              id="surge-mult"
              type="number"
              step="0.5"
              min={1}
              max={6}
              value={cfg?.min_multiplier ?? 3}
              onChange={(e) => patch({ min_multiplier: Number(e.target.value) })}
              className="min-h-11"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="surge-keywords" className="text-xs">
              Priority keywords (comma separated)
            </Label>
            <Textarea
              id="surge-keywords"
              rows={2}
              value={(cfg?.sprint_keywords || []).join(", ")}
              onChange={(e) =>
                patch({
                  sprint_keywords: e.target.value
                    .split(",")
                    .map((k) => k.trim().toLowerCase())
                    .filter(Boolean),
                })
              }
              placeholder="mdcat, sindh, class 9, spsc, sts"
            />
          </div>
        </div>

        <Button onClick={save} disabled={isSaving} className="gap-2 min-h-11">
          {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save surge settings
        </Button>

        <div className="pt-1">
          <p className="text-xs font-medium flex items-center gap-1.5 mb-1.5">
            <History className="h-3.5 w-3.5" />
            Recent automatic target raises
          </p>
          {events.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No automatic scaling yet — every test is inside its steady target.
            </p>
          ) : (
            <div className="space-y-1">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground rounded-md border border-border/50 px-2.5 py-1.5"
                >
                  <span className="truncate">{ev.test_title || "Unknown test"}</span>
                  <span className="whitespace-nowrap">
                    {ev.demand_tier} · {Math.round((ev.burn_rate || 0) * 100)}% burn →{" "}
                    {ev.effective_multiplier}× ({ev.effective_target} Qs) ·{" "}
                    {formatDistanceToNow(new Date(ev.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignSurgePanel;
