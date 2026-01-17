import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap, AlertTriangle, CheckCircle, Settings, RefreshCw, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  getAutoFillStats, 
  updateAutoFillConfig,
  type AIUsageToday,
  type AutoFillConfig,
  type AutoFillQueueItem
} from "@/services/autoFillService";
import ContentGapQueue from "./ContentGapQueue";
import AutoFillSettings from "./AutoFillSettings";

const AutoFillDashboard = () => {
  const [usage, setUsage] = useState<AIUsageToday | null>(null);
  const [config, setConfig] = useState<AutoFillConfig | null>(null);
  const [queueCount, setQueueCount] = useState(0);
  const [topPriorityTopics, setTopPriorityTopics] = useState<AutoFillQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const stats = await getAutoFillStats();
      setUsage(stats.usage);
      setConfig(stats.config);
      setQueueCount(stats.queueCount);
      setTopPriorityTopics(stats.topPriorityTopics);
    } catch (error) {
      console.error('Error loading auto-fill stats:', error);
      toast.error('Failed to load auto-fill data');
    } finally {
      setIsLoading(false);
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
      {/* Header */}
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
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Daily Quota Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
                <Progress value={usagePercentage} className={getProgressColor()} />
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
          transition={{ delay: 0.2 }}
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
          transition={{ delay: 0.3 }}
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
                <Badge variant={config?.enabled ? 'default' : 'outline'}>
                  {config?.priority === 'lowest_first' ? 'Priority: Lowest First' : 'Priority: Random'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Batch size: {config?.batch_size || 20} questions per topic
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
