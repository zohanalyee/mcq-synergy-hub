import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Flame, Activity } from "lucide-react";

const ScrapingAnalytics = () => {
  const { data: stats } = useQuery({
    queryKey: ["scraping-analytics"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("scraping_attempts" as any)
        .select("*")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      const attempts = (data || []) as any[];

      const cheerio = attempts.filter((a) => a.scraper_used === "cheerio");
      const firecrawl = attempts.filter((a) => a.scraper_used === "firecrawl");

      const cheerioSuccess = cheerio.filter((a) => a.success).length;
      const firecrawlSuccess = firecrawl.filter((a) => a.success).length;

      const avgTime = (arr: any[]) =>
        arr.length ? Math.round(arr.reduce((s, a) => s + (a.execution_time_ms || 0), 0) / arr.length) : 0;

      return {
        cheerio: {
          attempts: cheerio.length,
          success: cheerioSuccess,
          rate: cheerio.length ? ((cheerioSuccess / cheerio.length) * 100).toFixed(0) : "0",
          avgTime: avgTime(cheerio),
        },
        firecrawl: {
          attempts: firecrawl.length,
          success: firecrawlSuccess,
          rate: firecrawl.length ? ((firecrawlSuccess / firecrawl.length) * 100).toFixed(0) : "0",
          avgTime: avgTime(firecrawl),
        },
        totalItems: attempts.reduce((s, a) => s + (a.items_found || 0), 0),
      };
    },
  });

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
      <Card className="border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-400" /> Cheerio (Free)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold">{stats.cheerio.attempts}</div>
            <div className="text-[10px] text-muted-foreground">Attempts</div>
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-400">{stats.cheerio.rate}%</div>
            <div className="text-[10px] text-muted-foreground">Success</div>
          </div>
          <div>
            <div className="text-lg font-bold">{stats.cheerio.avgTime}ms</div>
            <div className="text-[10px] text-muted-foreground">Avg Time</div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-orange-400" /> Firecrawl (Paid)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold">{stats.firecrawl.attempts}</div>
            <div className="text-[10px] text-muted-foreground">Attempts</div>
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-400">{stats.firecrawl.rate}%</div>
            <div className="text-[10px] text-muted-foreground">Success</div>
          </div>
          <div>
            <div className="text-lg font-bold">{stats.firecrawl.avgTime}ms</div>
            <div className="text-[10px] text-muted-foreground">Avg Time</div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-blue-400" /> Total Items Found
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <div className="text-3xl font-bold">{stats.totalItems}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScrapingAnalytics;
