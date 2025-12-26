import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DayActivity {
  date: string;
  userCount: number;
  testCount: number;
}

const ActivityHeatmap = () => {
  const [activityData, setActivityData] = useState<Map<string, DayActivity>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivityData();
  }, []);

  const fetchActivityData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_daily_activity_stats', { days_back: 365 });
      
      if (error) throw error;

      const activityMap = new Map<string, DayActivity>();
      (data || []).forEach((row: { activity_date: string; user_count: number; test_count: number }) => {
        activityMap.set(row.activity_date, {
          date: row.activity_date,
          userCount: Number(row.user_count),
          testCount: Number(row.test_count),
        });
      });
      setActivityData(activityMap);
    } catch (error) {
      console.error("Error fetching activity data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate last 365 days
  const generateDays = () => {
    const days: Date[] = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  const days = generateDays();

  // Get activity level (0-4) based on test count
  const getActivityLevel = (testCount: number): number => {
    if (testCount === 0) return 0;
    if (testCount <= 5) return 1;
    if (testCount <= 15) return 2;
    if (testCount <= 30) return 3;
    return 4;
  };

  // Color classes based on activity level
  const getColorClass = (level: number): string => {
    switch (level) {
      case 0: return "bg-muted";
      case 1: return "bg-emerald-200 dark:bg-emerald-900";
      case 2: return "bg-emerald-400 dark:bg-emerald-700";
      case 3: return "bg-emerald-500 dark:bg-emerald-500";
      case 4: return "bg-emerald-600 dark:bg-emerald-400";
      default: return "bg-muted";
    }
  };

  // Group days by week for grid layout
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  days.forEach((day, index) => {
    const dayOfWeek = day.getDay();
    
    // Start new week on Sunday
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    
    currentWeek.push(day);
    
    if (index === days.length - 1) {
      weeks.push(currentWeek);
    }
  });

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-5 w-5 text-primary" />
            Activity Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  let totalTests = 0;
  let activeDays = 0;
  activityData.forEach((day) => {
    totalTests += day.testCount;
    if (day.testCount > 0) activeDays++;
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-5 w-5 text-primary" />
            Activity Heatmap (Last 365 Days)
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{totalTests} tests</span>
            <span>{activeDays} active days</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Month labels */}
        <div className="flex mb-1 ml-6 text-xs text-muted-foreground">
          {months.map((month, idx) => (
            <span key={month} className="flex-1 text-center">{month}</span>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-0.5 overflow-x-auto pb-2">
          {/* Day of week labels */}
          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground pr-1 shrink-0">
            <span className="h-3">S</span>
            <span className="h-3">M</span>
            <span className="h-3">T</span>
            <span className="h-3">W</span>
            <span className="h-3">T</span>
            <span className="h-3">F</span>
            <span className="h-3">S</span>
          </div>

          {/* Weeks */}
          <TooltipProvider delayDuration={100}>
            <div className="flex gap-0.5">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-0.5">
                  {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                    const day = week.find(d => d.getDay() === dayOfWeek);
                    if (!day) {
                      return <div key={dayOfWeek} className="w-3 h-3" />;
                    }

                    const dateStr = formatDate(day);
                    const activity = activityData.get(dateStr);
                    const testCount = activity?.testCount || 0;
                    const userCount = activity?.userCount || 0;
                    const level = getActivityLevel(testCount);

                    return (
                      <Tooltip key={dayOfWeek}>
                        <TooltipTrigger asChild>
                          <div
                            className={`w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary ${getColorClass(level)}`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <p className="font-semibold">{formatDisplayDate(day)}</p>
                            <p>{userCount} users active</p>
                            <p>{testCount} tests taken</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </TooltipProvider>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-2 text-xs text-muted-foreground">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`w-3 h-3 rounded-sm ${getColorClass(level)}`}
            />
          ))}
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityHeatmap;
