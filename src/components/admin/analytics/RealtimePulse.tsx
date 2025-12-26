import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Clock, Users, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface HourlyData {
  hour: number;
  label: string;
  testCount: number;
  userCount: number;
}

const RealtimePulse = () => {
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [peakHour, setPeakHour] = useState<{ hour: number; count: number } | null>(null);

  useEffect(() => {
    fetchData();
    
    // Refresh online users every 30 seconds
    const interval = setInterval(() => {
      fetchOnlineUsers();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchOnlineUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_recently_active_users', { minutes_ago: 15 });
      if (!error) {
        setOnlineUsers(Number(data) || 0);
      }
    } catch (error) {
      console.error("Error fetching online users:", error);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch online users
      await fetchOnlineUsers();

      // Fetch hourly distribution
      const { data: hourlyResult, error: hourlyError } = await supabase.rpc('get_hourly_activity_distribution');
      
      if (hourlyError) throw hourlyError;

      // Create full 24-hour data
      const fullHourlyData: HourlyData[] = [];
      for (let i = 0; i < 24; i++) {
        const hourData = (hourlyResult || []).find((h: { hour_of_day: number }) => h.hour_of_day === i);
        fullHourlyData.push({
          hour: i,
          label: `${i.toString().padStart(2, '0')}:00`,
          testCount: hourData ? Number(hourData.test_count) : 0,
          userCount: hourData ? Number(hourData.user_count) : 0,
        });
      }

      setHourlyData(fullHourlyData);

      // Find peak hour
      const peak = fullHourlyData.reduce((max, current) => 
        current.testCount > max.testCount ? current : max
      , { hour: 0, label: '', testCount: 0, userCount: 0 });
      
      setPeakHour({ hour: peak.hour, count: peak.testCount });

    } catch (error) {
      console.error("Error fetching hourly data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
  };

  const getBarColor = (hour: number): string => {
    // Morning (6-11): Yellow
    if (hour >= 6 && hour < 12) return '#fbbf24';
    // Afternoon (12-17): Orange
    if (hour >= 12 && hour < 18) return '#f97316';
    // Evening (18-23): Purple
    if (hour >= 18) return '#a855f7';
    // Night (0-5): Blue
    return '#3b82f6';
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Users Online Now Card */}
      <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5 text-emerald-500" />
            Real-Time Pulse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Users className="h-8 w-8 text-emerald-500" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <div>
              <p className="text-3xl font-bold">{onlineUsers}</p>
              <p className="text-sm text-muted-foreground">Users Online Now</p>
            </div>
          </div>
          
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Based on activity in last 15 minutes</p>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          {peakHour && peakHour.count > 0 && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">
                  Peak: <strong>{formatHour(peakHour.hour)}</strong> ({peakHour.count} tests)
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Peak Hours Chart */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-primary" />
              Peak Study Hours (Last 30 Days)
            </CardTitle>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-blue-500" /> Night
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-yellow-500" /> Morning
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-orange-500" /> Afternoon
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-purple-500" /> Evening
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={(h) => h % 3 === 0 ? formatHour(h) : ''} 
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as HourlyData;
                      return (
                        <div className="bg-popover border rounded-lg p-2 shadow-lg text-xs">
                          <p className="font-semibold">{formatHour(data.hour)}</p>
                          <p>{data.testCount} tests taken</p>
                          <p>{data.userCount} unique users</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="testCount" radius={[4, 4, 0, 0]}>
                  {hourlyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.hour)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealtimePulse;
