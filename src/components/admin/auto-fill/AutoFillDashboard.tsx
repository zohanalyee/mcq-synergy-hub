import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Zap, AlertTriangle, CheckCircle, Settings, RefreshCw, Clock, Play, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { 
  getAutoFillStats, 
  updateAutoFillConfig,
  getAIUsageToday,
  type AIUsageToday,
  type AutoFillConfig,
  type AutoFillQueueItem
} from "@/services/autoFillService";
import ContentGapQueue from "./ContentGapQueue";
import AutoFillSettings from "./AutoFillSettings";
import QuotaMonitor from "../QuotaMonitor";

const AutoFillDashboard = () => {
  const [usage, setUsage] = useState<AIUsageToday | null>(null);
  const [config, setConfig] = useState<AutoFillConfig | null>(null);
  const [queueCount, setQueueCount] = useState(0);
  const [topPriorityTopics, setTopPriorityTopics] = useState<AutoFillQueueItem[]>([]);
  const [lastRunInfo, setLastRunInfo] = useState<{ timestamp: string; questionsSaved: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isManualRunning, setIsManualRunning] = useState(false);
  
  // Guard against duplicate fetches
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);

  const loadData = async (force = false) => {
    if (isFetchingRef.current) return;
    if (!force && hasFetchedRef.current) return;
    
    isFetchingRef.current = true;
    setIsLoading(true);
    
    try {
      const stats = await getAutoFillStats();
      setUsage(stats.usage);
      setConfig(stats.config);
      setQueueCount(stats.queueCount);
      setTopPriorityTopics(stats.topPriorityTopics);
      setLastRunInfo(stats.lastRunInfo);
      hasFetchedRef.current = true;
    } catch (error) {
      console.error('Error loading auto-fill stats:', error);
      toast.error('Failed to load auto-fill data');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleManualRun = async () => {
    setIsManualRunning(true);
    try {
      const response = await supabase.functions.invoke('scheduled-autofill', {
        headers: { 'x-admin-trigger': 'true' }
      });

      if (response.error) {
        toast.error(`Manual run failed: ${response.error.message}`);
        return;
      }

      const result = response.data;
      if (result.success) {
        toast.success(`Auto-fill completed: ${result.questions_saved} questions saved`, {
          description: `Topics processed: ${result.topics_processed}. ${result.stop_reason}`
        });
        // Refresh data
        const newUsage = await getAIUsageToday();
        if (newUsage) setUsage(newUsage);
        loadData(true);
      } else {
        toast.error(result.error || 'Auto-fill failed');
      }
    } catch (error) {
      toast.error('Failed to trigger auto-fill');
      console.error('Manual run error:', error);
    } finally {
      setIsManualRunning(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleEnabled = async () => {
    if (!config) return;
    
    const newEnabled = !config.enabled;
    const success = await updateAutoFillConfig({ enabled: newEnabled });
    
    if (success) {
      setConfig({ ...config, enabled: newEnabled });
      toast.success(newEnabled ? 'Auto-fill enabled' : 'Auto-fill disabled');
    } else {
      toast.error('Failed to update settings');
    }
  };

  const usagePercentage = usage 
    ? Math.round((usage.total_requests / usage.daily_limit) * 100) 
    : 0;

  const getUsageColor = () => {
    if (usagePercentage >= 90) return 'text-destructive';
    if (usagePercentage >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getProgressColor = () => {
    if (usagePercentage >= 90) return 'bg-destructive';
    if (usagePercentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quota Monitor - Global AI usage overview */}
      <QuotaMonitor />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Smart Auto-Fill
          </h2>
          <p className="text-muted-foreground mt-1">
            Automatically generate questions for topics with content gaps
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => loadData(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quota Exhausted Warning */}
      {usage?.remaining_requests === 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Daily Quota Exhausted</AlertTitle>
          <AlertDescription>
            Auto-fill will resume tomorrow at 2:00 AM UTC. All {usage.daily_limit} requests used today.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Scheduler Status Card - NEW */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Scheduler Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Run:</span>
                  <span className="font-medium">
                    {lastRunInfo 
                      ? formatDistanceToNow(new Date(lastRunInfo.timestamp), { addSuffix: true })
                      : 'Never'}
                  </span>
                </div>
                {lastRunInfo && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Generated:</span>
                    <span className="font-medium">{lastRunInfo.questionsSaved} questions</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next Run:</span>
                  <span className="font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    2:00 AM UTC
                  </span>
                </div>
              </div>
              <Button 
                size="sm" 
                className="w-full gap-2"
                onClick={handleManualRun}
                disabled={isManualRunning || usage?.remaining_requests === 0}
              >
                {isManualRunning ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isManualRunning ? 'Running...' : 'Run Now'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Daily Quota Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Daily AI Quota
                <Badge variant={usagePercentage >= 90 ? 'destructive' : 'secondary'}>
                  {usage?.remaining_requests || 0} left
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={getUsageColor()}>
                    {usage?.total_requests || 0} / {usage?.daily_limit || 50}
                  </span>
                  <span className="text-muted-foreground">{usagePercentage}%</span>
                </div>
                <Progress value={usagePercentage} indicatorClassName={getProgressColor()} />
                <p className="text-xs text-muted-foreground">
                  {usage?.total_questions_saved || 0} questions generated today
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Content Gaps Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Content Gaps
                {queueCount > 0 ? (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{queueCount}</div>
              <p className="text-xs text-muted-foreground">
                Topics below threshold ({config?.min_threshold || 10} questions)
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Auto-Fill Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Auto-Fill Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={config?.enabled || false} 
                    onCheckedChange={handleToggleEnabled}
                    id="auto-fill-toggle"
                  />
                  <Label htmlFor="auto-fill-toggle" className="text-sm">
                    {config?.enabled ? 'Enabled' : 'Disabled'}
                  </Label>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {config?.enabled 
                  ? 'Runs at 2:00 AM UTC daily'
                  : 'Auto-fill is paused'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Settings Panel (Collapsible) */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <AutoFillSettings 
            config={config} 
            onConfigUpdate={(newConfig) => setConfig(newConfig)}
            onClose={() => setShowSettings(false)}
          />
        </motion.div>
      )}

      {/* Priority Queue */}
      <ContentGapQueue 
        topPriorityTopics={topPriorityTopics} 
        totalCount={queueCount}
        onRefresh={loadData}
      />
    </div>
  );
};

export default AutoFillDashboard;
