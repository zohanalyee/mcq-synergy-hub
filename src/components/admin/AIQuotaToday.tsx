import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

// Read-only "AI quota today" card. Reads one admin-only RPC; spends no AI calls.
type Quota = {
  next_reset: string;
  budget: { enabled: boolean; total_max: number; groups: Record<string, { reserve?: number; max?: number }> } | null;
  key_health: { keys?: Record<string, { ok: boolean; cooldown_until?: number }> } | null;
  groups: Record<string, number>;
  keys: { key_index: number; requests: number; rate_limited: number }[];
  paid_today: number;
  paid_background_today: number;
};

const GROUPS: { id: string; label: string }[] = [
  { id: "user", label: "Learners" },
  { id: "quality_gate", label: "Quality gate" },
  { id: "auto_fill", label: "Auto-fill" },
  { id: "admin_bulk", label: "Admin bulk" },
];

const pkt = (ms: number | string) =>
  new Date(ms).toLocaleString("en-PK", { timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });

const AIQuotaToday = () => {
  const [q, setQ] = useState<Quota | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase.rpc as any)("get_ai_quota_today");
    if (error) setErr(error.message);
    else { setQ(data as Quota); setErr(null); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const now = Date.now();
  const total = q ? Object.values(q.groups).reduce((s, n) => s + n, 0) : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-3 mb-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">AI quota today (free keys)</h3>
          {q && <p className="text-xs text-muted-foreground">Resets {pkt(q.next_reset)} PKT · {total}/{q.budget?.total_max ?? "—"} used</p>}
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading} aria-label="Refresh AI quota">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>
      {err && <p className="text-xs text-destructive">{err}</p>}
      {q && (
        <>
          <div className="space-y-2">
            {GROUPS.map(({ id, label }) => {
              const used = q.groups[id] ?? 0;
              const cfg = q.budget?.groups?.[id];
              const limit = id === "user" ? cfg?.reserve ?? 0 : cfg?.max ?? 0;
              return (
                <div key={id}>
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground">{label}{id === "user" ? " (reserved)" : ""}</span>
                    <span className="text-muted-foreground">{used}/{limit} · {Math.max(0, limit - used)} left</span>
                  </div>
                  <Progress value={limit ? Math.min(100, (used / limit) * 100) : 0} className="h-1.5" />
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => {
              const k = q.keys.find((x) => x.key_index === i);
              const h = q.key_health?.keys?.[String(i)];
              const cooling = !!h && !h.ok && !!h.cooldown_until && h.cooldown_until > now;
              return (
                <div key={i} className="rounded-lg border border-border p-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">Key #{i + 1}</span>
                    {cooling
                      ? <Badge variant="destructive">Cooling until {pkt(h!.cooldown_until!)}</Badge>
                      : <Badge variant="secondary">OK</Badge>}
                  </div>
                  <p className="text-muted-foreground mt-1">{k?.requests ?? 0} requests · {k?.rate_limited ?? 0} rate-limited</p>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Paid calls today: {q.paid_today} (background jobs: <span className={q.paid_background_today ? "text-destructive font-semibold" : ""}>{q.paid_background_today}</span>, should be 0)
          </p>
        </>
      )}
    </div>
  );
};

export default AIQuotaToday;
