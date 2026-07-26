import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert, Bug, Clock, Globe, AlertTriangle, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Stats = {
  total_24h: number;
  total_7d: number;
  total_30d: number;
  top_ips: Array<{ ip_hash: string; hits: number }>;
};

type SignalRow = {
  id: string;
  created_at: string;
  ip_hash: string;
  user_agent: string | null;
  endpoint: string;
  signal_type: string;
  metadata: Record<string, unknown> | null;
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  hint,
  tone = "rose",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "rose" | "amber" | "cyan" | "violet";
}) => {
  const toneMap: Record<string, string> = {
    rose: "from-rose-500/10 to-transparent border-rose-500/20 text-rose-400",
    amber: "from-amber-500/10 to-transparent border-amber-500/20 text-amber-400",
    cyan: "from-cyan-500/10 to-transparent border-cyan-500/20 text-cyan-400",
    violet: "from-violet-500/10 to-transparent border-violet-500/20 text-violet-400",
  };
  return (
    <Card className={`bg-gradient-to-br ${toneMap[tone]}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs">{label}</CardDescription>
          <Icon className="h-4 w-4 opacity-70" />
        </div>
        <CardTitle className="text-2xl font-bold text-foreground">{value}</CardTitle>
      </CardHeader>
      {hint && <CardContent className="pt-0 text-xs text-muted-foreground">{hint}</CardContent>}
    </Card>
  );
};

const truncateHash = (hash: string, len = 12) =>
  hash.length <= len ? hash : `${hash.slice(0, len)}…`;

const ScraperSignalsDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [signals, setSignals] = useState<SignalRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [s, l] = await Promise.all([
        supabase.rpc("get_scraper_signal_stats" as any),
        supabase.rpc("get_scraper_signal_log" as any, { p_limit: 50 }),
      ]);
      if (s.data) setStats(s.data as Stats);
      if (l.data) setSignals(l.data as SignalRow[]);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <Card className="border-rose-500/10 bg-gradient-to-br from-card to-rose-500/5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-400" />
            <CardTitle className="text-lg">Scraper Signals</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Observe-only honeypot and rate-limit telemetry. No blocking is active yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            The <code className="rounded bg-muted px-1 py-0.5 text-xs">/functions/v1/honeypot-questions-dump</code> edge function
            is a decoy endpoint. Every hit is logged here. Use this data to decide when to flip
            Cloudflare rules from Log to Block mode.
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard
            icon={Bug}
            label="Honeypot hits (24h)"
            value={stats?.total_24h ?? 0}
            hint="Decoy endpoint calls in last 24 hours"
            tone="rose"
          />
          <StatCard
            icon={Clock}
            label="Honeypot hits (7d)"
            value={stats?.total_7d ?? 0}
            hint="Rolling 7-day window"
            tone="amber"
          />
          <StatCard
            icon={Eye}
            label="Honeypot hits (30d)"
            value={stats?.total_30d ?? 0}
            hint="Rolling 30-day window"
            tone="cyan"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-rose-500/10 bg-gradient-to-br from-card to-rose-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-rose-400" />
              <CardTitle className="text-base">Top IP hashes (7d)</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Hashed IPs with the most honeypot hits. No raw IPs are stored.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48" />
            ) : stats?.top_ips && stats.top_ips.length > 0 ? (
              <div className="space-y-2">
                {stats.top_ips.map((ip, idx) => (
                  <div
                    key={ip.ip_hash}
                    className="flex items-center justify-between rounded-lg border border-rose-500/10 bg-rose-500/5 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">#{idx + 1}</span>
                      <code className="text-xs font-mono">{truncateHash(ip.ip_hash)}</code>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {ip.hits} hits
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 opacity-50" />
                <p className="text-sm">No signals yet</p>
                <p className="text-xs">Honeypot hits will appear here once scrapers discover the endpoint.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-rose-500/10 bg-gradient-to-br from-card to-rose-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-rose-400" />
              <CardTitle className="text-base">Recent signals</CardTitle>
            </div>
            <CardDescription className="text-xs">Last 50 honeypot events</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48" />
            ) : signals.length > 0 ? (
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                {signals.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-lg border border-rose-500/10 bg-rose-500/5 p-2.5 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-[10px] border-rose-500/20 text-rose-300">
                        {s.signal_type}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">{truncateHash(s.ip_hash, 16)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 break-all">
                      {s.user_agent || "No user agent"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 opacity-50" />
                <p className="text-sm">No signals yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScraperSignalsDashboard;
