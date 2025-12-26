import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingDown, 
  Timer, 
  Crown, 
  Users, 
  Target,
  Trophy
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RetentionStats {
  totalUsers: number;
  activeUsers: number;
  bounceRate: number;
  avgSessionTime: number;
  totalTests: number;
}

interface PowerUser {
  userId: string;
  username: string;
  totalTests: number;
  totalTimeSpent: number;
  avgScore: number;
  lastActive: string;
}

const UserRetentionMetrics = () => {
  const [stats, setStats] = useState<RetentionStats | null>(null);
  const [powerUsers, setPowerUsers] = useState<PowerUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch retention stats
      const { data: retentionData, error: retentionError } = await supabase.rpc('get_user_retention_stats');
      
      if (retentionError) throw retentionError;

      if (retentionData && retentionData.length > 0) {
        const row = retentionData[0];
        setStats({
          totalUsers: Number(row.total_users),
          activeUsers: Number(row.active_users),
          bounceRate: Number(row.bounce_rate),
          avgSessionTime: Number(row.avg_session_time),
          totalTests: Number(row.total_tests),
        });
      }

      // Fetch power users
      const { data: powerUsersData, error: powerUsersError } = await supabase.rpc('get_power_users', { limit_count: 10 });
      
      if (powerUsersError) throw powerUsersError;

      setPowerUsers((powerUsersData || []).map((u: {
        user_id: string;
        username: string;
        total_tests: number;
        total_time_spent: number;
        avg_score: number;
        last_active: string;
      }) => ({
        userId: u.user_id,
        username: u.username || 'Anonymous',
        totalTests: Number(u.total_tests),
        totalTimeSpent: Number(u.total_time_spent),
        avgScore: Number(u.avg_score) || 0,
        lastActive: u.last_active,
      })));

    } catch (error) {
      console.error("Error fetching retention data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins < 60) return `${mins}m ${secs}s`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const formatRelativeTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getBounceRateColor = (rate: number): string => {
    if (rate <= 20) return 'text-emerald-500';
    if (rate <= 40) return 'text-yellow-500';
    if (rate <= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (index === 1) return <Trophy className="h-4 w-4 text-slate-400" />;
    if (index === 2) return <Trophy className="h-4 w-4 text-amber-600" />;
    return <span className="text-xs text-muted-foreground w-4 text-center">{index + 1}</span>;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.activeUsers || 0}</p>
                <p className="text-xs text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bounce Rate */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingDown className={`h-8 w-8 ${getBounceRateColor(stats?.bounceRate || 0)}`} />
              <div>
                <p className={`text-2xl font-bold ${getBounceRateColor(stats?.bounceRate || 0)}`}>
                  {stats?.bounceRate || 0}%
                </p>
                <p className="text-xs text-muted-foreground">Bounce Rate</p>
              </div>
            </div>
            <Progress 
              value={100 - (stats?.bounceRate || 0)} 
              className="mt-2 h-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.totalUsers && stats?.activeUsers 
                ? `${stats.totalUsers - stats.activeUsers} users never took a test`
                : 'No data'}
            </p>
          </CardContent>
        </Card>

        {/* Avg Session Time */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Timer className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{formatTime(stats?.avgSessionTime || 0)}</p>
                <p className="text-xs text-muted-foreground">Avg Session Time</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Across {stats?.totalTests || 0} total tests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Power Users */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Crown className="h-5 w-5 text-yellow-500" />
            Power Users (Top 10 by Activity)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {powerUsers.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No user activity data available yet.
            </p>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {powerUsers.map((user, index) => (
                  <div 
                    key={user.userId}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-6 flex justify-center">
                      {getRankBadge(index)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{user.username}</p>
                      <p className="text-xs text-muted-foreground">
                        Last active: {formatRelativeTime(user.lastActive)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {user.totalTests} tests
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {formatTime(user.totalTimeSpent)}
                      </Badge>
                      {user.avgScore > 0 && (
                        <Badge 
                          variant={user.avgScore >= 70 ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {user.avgScore}%
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRetentionMetrics;
