import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QrCode, Users, MousePointerClick, Target, RefreshCw, Megaphone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import EmailRemindersPanel from "./EmailRemindersPanel";

type CampaignRow = {
  campaign: string;
  visits_today: number;
  visits_7d: number;
  visits_total: number;
  signups: number;
  signups_7d: number;
  students_practiced: number;
  tests_completed: number;
  first_visit: string | null;
  last_visit: string | null;
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  hint,
  tone = "violet",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "violet" | "cyan" | "emerald" | "amber";
}) => {
  const toneMap: Record<string, string> = {
    violet: "from-violet-500/10 to-transparent border-violet-500/20 text-violet-400",
    cyan: "from-cyan-500/10 to-transparent border-cyan-500/20 text-cyan-400",
    emerald: "from-emerald-500/10 to-transparent border-emerald-500/20 text-emerald-400",
    amber: "from-amber-500/10 to-transparent border-amber-500/20 text-amber-400",
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

const CampaignsDashboard = () => {
  const [rows, setRows] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.rpc("get_campaign_stats" as any);
    setRows((data as CampaignRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const totals = rows.reduce(
    (acc, r) => ({
      visits: acc.visits + Number(r.visits_total || 0),
      today: acc.today + Number(r.visits_today || 0),
      signups: acc.signups + Number(r.signups || 0),
      tests: acc.tests + Number(r.tests_completed || 0),
    }),
    { visits: 0, today: 0, signups: 0, tests: 0 },
  );

  const rate = (signups: number, visits: number) =>
    visits > 0 ? `${Math.round((signups / visits) * 100)}%` : "—";

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Megaphone className="h-5 w-5 text-violet-400" />
            Offline Campaigns
          </h2>
          <p className="text-xs text-muted-foreground">
            QR / banner traffic and the signups it produced. Print QR codes as
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[11px]">
              /larkana?utm_source=library_banner&amp;utm_medium=qr&amp;utm_campaign=larkana_library
            </code>
          </p>
        </div>
        <Button variant="outline" size="sm" className="min-h-11 shrink-0" onClick={load}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={QrCode} label="Total scans / visits" value={totals.visits} tone="violet" />
        <StatCard icon={MousePointerClick} label="Visits today" value={totals.today} tone="cyan" />
        <StatCard
          icon={Users}
          label="Attributed signups"
          value={totals.signups}
          hint={`Conversion ${rate(totals.signups, totals.visits)}`}
          tone="emerald"
        />
        <StatCard icon={Target} label="Tests completed" value={totals.tests} tone="amber" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Per-campaign breakdown</CardTitle>
          <CardDescription className="text-xs">
            Signups are attributed for 30 days after the first scan, even if the visitor signs up later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No campaign visits recorded yet. Scans will appear here within seconds of the first QR scan.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Campaign</th>
                    <th className="py-2 pr-3 font-medium">Today</th>
                    <th className="py-2 pr-3 font-medium">7d</th>
                    <th className="py-2 pr-3 font-medium">Total</th>
                    <th className="py-2 pr-3 font-medium">Signups</th>
                    <th className="py-2 pr-3 font-medium">Conv.</th>
                    <th className="py-2 pr-3 font-medium">Practised</th>
                    <th className="py-2 pr-3 font-medium">Tests done</th>
                    <th className="py-2 pr-3 font-medium">Last scan</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.campaign} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">
                        <Badge variant="outline" className="border-violet-500/30 text-violet-400">
                          {r.campaign}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3">{r.visits_today}</td>
                      <td className="py-2 pr-3">{r.visits_7d}</td>
                      <td className="py-2 pr-3 font-semibold">{r.visits_total}</td>
                      <td className="py-2 pr-3">
                        {r.signups}
                        {Number(r.signups_7d) > 0 && (
                          <span className="ml-1 text-xs text-emerald-400">+{r.signups_7d} (7d)</span>
                        )}
                      </td>
                      <td className="py-2 pr-3">{rate(Number(r.signups), Number(r.visits_total))}</td>
                      <td className="py-2 pr-3">{r.students_practiced}</td>
                      <td className="py-2 pr-3">{r.tests_completed}</td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">
                        {r.last_visit
                          ? `${formatDistanceToNow(new Date(r.last_visit))} ago`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <EmailRemindersPanel />
    </div>

  );
};

export default CampaignsDashboard;
