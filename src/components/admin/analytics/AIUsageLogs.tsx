import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Activity, RefreshCw, TrendingUp, TrendingDown, Database, Zap, User, Bot } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AIUsageLog {
  id: string;
  triggered_by_user_id: string | null;
  source_type: string;
  subject: string | null;
  topic: string | null;
  difficulty: string | null;
  questions_requested: number;
  questions_fetched: number;
  questions_saved: number;
  metadata: unknown;
  created_at: string;
}

interface UsageStats {
  totalRequests: number;
  totalFetched: number;
  totalSaved: number;
  avgEfficiency: number;
  userRequests: number;
  adminRequests: number;
}

const AIUsageLogs = () => {
  const [logs, setLogs] = useState<AIUsageLog[]>([]);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('ai_usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (sourceFilter !== "all") {
        query = query.eq('source_type', sourceFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching logs:', error);
        return;
      }

      setLogs(data || []);

      // Calculate stats
      const allLogsQuery = supabase
        .from('ai_usage_logs')
        .select('source_type, questions_requested, questions_fetched, questions_saved');

      const { data: allLogs } = await allLogsQuery;

      if (allLogs) {
        const totalRequests = allLogs.length;
        const totalFetched = allLogs.reduce((sum, l) => sum + (l.questions_fetched || 0), 0);
        const totalSaved = allLogs.reduce((sum, l) => sum + (l.questions_saved || 0), 0);
        const avgEfficiency = totalFetched > 0 ? Math.round((totalSaved / totalFetched) * 100) : 0;
        const userRequests = allLogs.filter(l => l.source_type === 'user_test_session').length;
        const adminRequests = allLogs.filter(l => l.source_type === 'admin_bulk_generator').length;

        setStats({
          totalRequests,
          totalFetched,
          totalSaved,
          avgEfficiency,
          userRequests,
          adminRequests
        });
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [sourceFilter, page]);

  const getEfficiencyColor = (fetched: number, saved: number) => {
    if (fetched === 0) return "text-muted-foreground";
    const ratio = saved / fetched;
    if (ratio >= 0.9) return "text-green-600";
    if (ratio >= 0.7) return "text-yellow-600";
    return "text-red-600";
  };

  const getEfficiencyBadge = (fetched: number, saved: number) => {
    if (fetched === 0) return <Badge variant="secondary">Cache Hit</Badge>;
    const ratio = saved / fetched;
    if (ratio >= 0.9) return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Excellent</Badge>;
    if (ratio >= 0.7) return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">Good</Badge>;
    return <Badge className="bg-red-500/20 text-red-700 border-red-500/30">High Waste</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Requests</span>
            </div>
            <div className="text-xl font-bold mt-1">{stats.totalRequests}</div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">AI Generated</span>
            </div>
            <div className="text-xl font-bold mt-1">{stats.totalFetched}</div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Saved to DB</span>
            </div>
            <div className="text-xl font-bold mt-1">{stats.totalSaved}</div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              {stats.avgEfficiency >= 70 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className="text-xs text-muted-foreground">Efficiency</span>
            </div>
            <div className={`text-xl font-bold mt-1 ${stats.avgEfficiency >= 70 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.avgEfficiency}%
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">User Tests</span>
            </div>
            <div className="text-xl font-bold mt-1">{stats.userRequests}</div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Admin Bulk</span>
            </div>
            <div className="text-xl font-bold mt-1">{stats.adminRequests}</div>
          </Card>
        </div>
      )}

      {/* Logs Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                AI Usage Logs
              </CardTitle>
              <CardDescription>Track AI generation requests and efficiency</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[160px] h-8">
                  <SelectValue placeholder="Filter by source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="user_test_session">User Tests</SelectItem>
                  <SelectItem value="admin_bulk_generator">Admin Bulk</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchLogs}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No AI usage logs yet</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="[&_td]:py-2 [&_th]:py-2">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Source</TableHead>
                      <TableHead className="text-xs">Subject/Topic</TableHead>
                      <TableHead className="text-xs">Difficulty</TableHead>
                      <TableHead className="text-xs text-center">Requested</TableHead>
                      <TableHead className="text-xs text-center">Fetched</TableHead>
                      <TableHead className="text-xs text-center">Saved</TableHead>
                      <TableHead className="text-xs">Efficiency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {format(new Date(log.created_at), 'MMM d, HH:mm')}
                        </TableCell>
                        <TableCell>
                          {log.source_type === 'admin_bulk_generator' ? (
                            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-700 border-purple-500/30">
                              <Bot className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-700 border-blue-500/30">
                              <User className="h-3 w-3 mr-1" />
                              User
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs max-w-[150px] truncate">
                          {log.topic || log.subject || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {log.difficulty || 'mixed'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-xs font-medium">
                          {log.questions_requested}
                        </TableCell>
                        <TableCell className="text-center text-xs font-medium text-yellow-600">
                          {log.questions_fetched}
                        </TableCell>
                        <TableCell className="text-center text-xs font-medium text-green-600">
                          {log.questions_saved}
                        </TableCell>
                        <TableCell>
                          {getEfficiencyBadge(log.questions_fetched, log.questions_saved)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">Page {page + 1}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => p + 1)}
                  disabled={logs.length < PAGE_SIZE}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIUsageLogs;
