import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Globe, Play, Loader2, RefreshCw, ExternalLink, Clock,
  GraduationCap, Briefcase, FileText, Award, Zap, Flame, Settings2, Search, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import SourceConfigDialog from "./SourceConfigDialog";
import ScrapingAnalytics from "./ScrapingAnalytics";

interface ScrapingSource {
  id: string;
  name: string;
  type: string;
  url: string;
  scraping_frequency: string;
  is_active: boolean;
  last_scraped_at: string | null;
  last_scrape_found: number;
  last_scrape_saved: number;
  notes: string | null;
  custom_selectors: any;
  needs_firecrawl: boolean;
  scraper_preference: string;
  last_scraper_used: string | null;
  firecrawl_crawl_enabled: boolean;
  firecrawl_max_depth: number;
}

const typeIcons: Record<string, React.ElementType> = {
  scholarship: GraduationCap,
  job: Briefcase,
  tender: FileText,
  board_result: Award,
};

const typeColors: Record<string, string> = {
  scholarship: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  job: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  tender: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  board_result: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

const ScrapingSourcesManager = () => {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("all");
  const [scrapingId, setScrapingId] = useState<string | null>(null);
  const [smartSearching, setSmartSearching] = useState(false);
  const [configSource, setConfigSource] = useState<ScrapingSource | null>(null);
  const [approvingAll, setApprovingAll] = useState(false);

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ["scraping-sources", typeFilter],
    queryFn: async () => {
      let query = supabase.from("scraping_sources").select("*").order("type").order("name");
      if (typeFilter !== "all") query = query.eq("type", typeFilter);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ScrapingSource[];
    },
  });

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["pending-opportunities-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("external_opportunities")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw error;
      return count || 0;
    },
  });

  const handleApproveAll = async () => {
    setApprovingAll(true);
    try {
      const { error } = await supabase
        .from("external_opportunities")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("status", "pending");
      if (error) throw error;
      toast.success(`Approved all pending items!`);
      queryClient.invalidateQueries({ queryKey: ["pending-opportunities-count"] });
    } catch (err: any) {
      toast.error(`Failed to approve: ${err.message}`);
    } finally {
      setApprovingAll(false);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("scraping_sources")
      .update({ is_active: !current })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update source");
    } else {
      toast.success(`Source ${!current ? "activated" : "deactivated"}`);
      queryClient.invalidateQueries({ queryKey: ["scraping-sources"] });
    }
  };

  const handleScrapeNow = async (source: ScrapingSource) => {
    setScrapingId(source.id);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-hybrid", {
        body: { sourceId: source.id },
      });
      if (error) throw error;
      toast.success(
        `${source.name}: ${data?.scraperUsed === "firecrawl" ? "🔥" : "⚡"} Found ${data?.found || 0}, Saved ${data?.saved || 0}`
      );
      queryClient.invalidateQueries({ queryKey: ["scraping-sources"] });
      queryClient.invalidateQueries({ queryKey: ["scraping-analytics"] });
    } catch (err: any) {
      toast.error(`Scraping failed: ${err.message}`);
    } finally {
      setScrapingId(null);
    }
  };

  const handleSmartSearch = async () => {
    setSmartSearching(true);
    const activeSources = sources.filter((s) => s.is_active);
    let totalFound = 0;
    let totalSaved = 0;
    toast.info(`Starting Smart Search across ${activeSources.length} sources...`);

    for (const source of activeSources) {
      try {
        const { data, error } = await supabase.functions.invoke("scrape-hybrid", {
          body: { sourceId: source.id },
        });
        if (error) throw error;
        totalFound += data?.found || 0;
        totalSaved += data?.saved || 0;
        toast.success(`${source.name}: ${data?.scraperUsed === "firecrawl" ? "🔥" : "⚡"} Found ${data?.found || 0}, Saved ${data?.saved || 0}`);
      } catch (err: any) {
        toast.error(`${source.name} failed: ${err.message}`);
      }
    }

    toast.success(`Smart Search Complete! Total: ${totalFound} found, ${totalSaved} saved`, { duration: 5000 });
    queryClient.invalidateQueries({ queryKey: ["scraping-sources"] });
    queryClient.invalidateQueries({ queryKey: ["scraping-analytics"] });
    setSmartSearching(false);
  };

  const typeCounts = sources.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-400" />
          <h3 className="text-sm font-semibold">Scraping Sources</h3>
          <Badge variant="outline" className="text-xs">{sources.length} sources</Badge>
          {pendingCount > 0 && (
            <Badge className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30">
              {pendingCount} pending
            </Badge>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={handleSmartSearch}
            disabled={smartSearching || sources.filter((s) => s.is_active).length === 0}
            className="h-8 text-xs bg-gradient-to-r from-blue-600 to-violet-600 border-0"
          >
            {smartSearching ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Searching...</>
            ) : (
              <><Search className="h-3.5 w-3.5 mr-1" /> Smart Search All</>
            )}
          </Button>
          {pendingCount > 0 && (
            <Button
              size="sm"
              onClick={handleApproveAll}
              disabled={approvingAll}
              className="h-8 text-xs bg-gradient-to-r from-emerald-600 to-green-600 border-0"
            >
              {approvingAll ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Approving...</>
              ) : (
                <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve All ({pendingCount})</>
              )}
            </Button>
          )}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue placeholder="Filter type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="scholarship">Scholarships ({typeCounts.scholarship || 0})</SelectItem>
              <SelectItem value="job">Jobs ({typeCounts.job || 0})</SelectItem>
              <SelectItem value="tender">Tenders ({typeCounts.tender || 0})</SelectItem>
              <SelectItem value="board_result">Board Results ({typeCounts.board_result || 0})</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline" size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["scraping-sources"] })}
            className="h-8 border-border/50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Card className="border-border/30">
        <Table>
          <TableHeader>
            <TableRow className="border-border/20">
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Frequency</TableHead>
              <TableHead className="text-xs">Last Scraped</TableHead>
              <TableHead className="text-xs">Found/Saved</TableHead>
              <TableHead className="text-xs">Scraper</TableHead>
              <TableHead className="text-xs">Active</TableHead>
              <TableHead className="text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : sources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                  No sources found
                </TableCell>
              </TableRow>
            ) : (
              sources.map((source) => {
                const TypeIcon = typeIcons[source.type] || Globe;
                const isCurrentlyScraping = scrapingId === source.id;
                return (
                  <TableRow key={source.id} className="border-border/10">
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px]", typeColors[source.type] || "")}>
                        <TypeIcon className="h-3 w-3 mr-1" />
                        {source.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{source.name}</span>
                        <a
                          href={source.url} target="_blank" rel="noopener noreferrer"
                          className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5 max-w-[200px] truncate"
                        >
                          <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                          {source.url}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        <Clock className="h-2.5 w-2.5 mr-1" />
                        {source.scraping_frequency}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">
                      {source.last_scraped_at
                        ? formatDistanceToNow(new Date(source.last_scraped_at), { addSuffix: true })
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="text-emerald-400">{source.last_scrape_found}</span>
                      {" / "}
                      <span className="text-blue-400">{source.last_scrape_saved}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {source.last_scraper_used ? (
                          <Badge variant="outline" className={cn("text-[10px]",
                            source.last_scraper_used === "firecrawl"
                              ? "text-orange-400 bg-orange-500/10 border-orange-500/20"
                              : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                          )}>
                            {source.last_scraper_used === "firecrawl" ? (
                              <Flame className="h-2.5 w-2.5 mr-0.5" />
                            ) : (
                              <Zap className="h-2.5 w-2.5 mr-0.5" />
                            )}
                            {source.last_scraper_used}
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={source.is_active}
                        onCheckedChange={() => handleToggleActive(source.id, source.is_active)}
                        className="scale-75"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm" variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => setConfigSource(source)}
                        >
                          <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          className="h-7 text-xs border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                          disabled={isCurrentlyScraping || !source.is_active}
                          onClick={() => handleScrapeNow(source)}
                        >
                          {isCurrentlyScraping ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Play className="h-3 w-3 mr-1" />
                          )}
                          Scrape
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <ScrapingAnalytics />

      {configSource && (
        <SourceConfigDialog
          source={configSource}
          open={!!configSource}
          onOpenChange={(open) => { if (!open) setConfigSource(null); }}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["scraping-sources"] })}
        />
      )}
    </div>
  );
};

export default ScrapingSourcesManager;
