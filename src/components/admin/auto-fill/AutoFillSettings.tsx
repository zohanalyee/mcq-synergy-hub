import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, X, Database, Loader2, Play, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  updateAutoFillConfig, 
  updateAILimitConfig,
  updateLowContentThreshold,
  getAILimitConfig,
  getLowContentThreshold,
  backfillTopicIds,
  getAIUsageToday,
  type AutoFillConfig,
  type DifficultyWeights
} from "@/services/autoFillService";

interface AutoFillSettingsProps {
  config: AutoFillConfig | null;
  onConfigUpdate: (config: AutoFillConfig) => void;
  onClose: () => void;
}

const DEFAULT_WEIGHTS: DifficultyWeights = { easy: 20, medium: 60, hard: 20 };

const AutoFillSettings = ({ config, onConfigUpdate, onClose }: AutoFillSettingsProps) => {
  const [localConfig, setLocalConfig] = useState<AutoFillConfig>(config || {
    enabled: false,
    min_threshold: 10,
    batch_size: 20,
    priority: 'lowest_first',
    difficulty_weights: DEFAULT_WEIGHTS
  });
  
  const [dailyLimit, setDailyLimit] = useState(50);
  const [warningThreshold, setWarningThreshold] = useState(10);
  const [criticalThreshold, setCriticalThreshold] = useState(5);
  const [difficultyWeights, setDifficultyWeights] = useState<DifficultyWeights>(
    config?.difficulty_weights || DEFAULT_WEIGHTS
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [isManualRunning, setIsManualRunning] = useState(false);
  const [todayUsage, setTodayUsage] = useState<{ requests: number; saved: number } | null>(null);
  
  const weightsTotal = difficultyWeights.easy + difficultyWeights.medium + difficultyWeights.hard;
  const isWeightsValid = weightsTotal === 100;

  // Hard safety limits
  const HARD_BATCH_LIMIT = 5;
  const HARD_NIGHTLY_LIMIT = 50;

  // Load additional settings on mount - useEffect runs only once
  useEffect(() => {
    const loadSettings = async () => {
      const [limitConfig, thresholdConfig, usage] = await Promise.all([
        getAILimitConfig(),
        getLowContentThreshold(),
        getAIUsageToday()
      ]);
      
      if (limitConfig) setDailyLimit(limitConfig.max_requests);
      if (thresholdConfig) {
        setWarningThreshold(thresholdConfig.warning);
        setCriticalThreshold(thresholdConfig.critical);
      }
      if (usage) {
        setTodayUsage({ requests: usage.total_requests, saved: usage.total_questions_saved });
      }
    };
    loadSettings();
  }, []); // Empty dependency array = run only on mount

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
        // Refresh usage stats
        const usage = await getAIUsageToday();
        if (usage) setTodayUsage({ requests: usage.total_requests, saved: usage.total_questions_saved });
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

  const handleSave = async () => {
    if (!isWeightsValid) {
      toast.error('Difficulty weights must sum to 100%');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const configWithWeights = { ...localConfig, difficulty_weights: difficultyWeights };
      
      const results = await Promise.all([
        updateAutoFillConfig(configWithWeights),
        updateAILimitConfig({ max_requests: dailyLimit }),
        updateLowContentThreshold({ warning: warningThreshold, critical: criticalThreshold })
      ]);
      
      if (results.every(r => r)) {
        toast.success('Settings saved successfully');
        onConfigUpdate(configWithWeights);
        onClose();
      } else {
        toast.error('Some settings failed to save');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleWeightChange = (level: keyof DifficultyWeights, value: number) => {
    setDifficultyWeights(prev => ({ ...prev, [level]: value }));
  };

  const handleBackfill = async () => {
    setIsBackfilling(true);
    try {
      const result = await backfillTopicIds();
      if (result.success) {
        toast.success(`Backfill complete! Updated ${result.updated_count} questions`, {
          description: result.matched_topics.length > 0 
            ? `Matched topics: ${result.matched_topics.slice(0, 5).join(', ')}${result.matched_topics.length > 5 ? '...' : ''}`
            : 'No matches found'
        });
      } else {
        toast.error(`Backfill failed: ${result.error}`);
      }
    } catch (error) {
      toast.error('Backfill operation failed');
      console.error('Backfill error:', error);
    } finally {
      setIsBackfilling(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Auto-Fill Settings</CardTitle>
              <CardDescription>
                Configure AI generation limits and thresholds
              </CardDescription>
            </div>
            <button onClick={onClose} className="h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:scale-110 transition-transform">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Safety Warning */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Safety Limits Active</AlertTitle>
            <AlertDescription>
              Hard limits enforced: Max {HARD_BATCH_LIMIT} questions per topic, {HARD_NIGHTLY_LIMIT} questions per night.
              RAG documents are used first when available.
            </AlertDescription>
          </Alert>

          {/* Today's Usage */}
          {todayUsage && (
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <div>
                <p className="font-medium text-sm">Today's Generation</p>
                <p className="text-xs text-muted-foreground">
                  {todayUsage.requests} requests • {todayUsage.saved} questions saved
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleManualRun}
                disabled={isManualRunning}
              >
                {isManualRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {isManualRunning ? 'Running...' : 'Manual Run'}
              </Button>
            </div>
          )}

          {/* Daily Limit Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Daily AI Limits</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="daily-limit">Max Requests per Day</Label>
                <Input
                  id="daily-limit"
                  type="number"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(parseInt(e.target.value) || 50)}
                  min={1}
                  max={1000}
                />
                <p className="text-xs text-muted-foreground">
                  Free tier typically allows 50-100 requests/day
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Threshold Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Content Thresholds</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Minimum Questions per Topic</Label>
                  <span className="text-sm font-medium">{localConfig.min_threshold}</span>
                </div>
                <Slider
                  value={[localConfig.min_threshold]}
                  onValueChange={([value]) => setLocalConfig({ ...localConfig, min_threshold: value })}
                  min={5}
                  max={50}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  Topics with fewer questions will appear in the queue
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="warning-threshold">Warning Threshold</Label>
                  <Input
                    id="warning-threshold"
                    type="number"
                    value={warningThreshold}
                    onChange={(e) => setWarningThreshold(parseInt(e.target.value) || 10)}
                    min={1}
                    max={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="critical-threshold">Critical Threshold</Label>
                  <Input
                    id="critical-threshold"
                    type="number"
                    value={criticalThreshold}
                    onChange={(e) => setCriticalThreshold(parseInt(e.target.value) || 5)}
                    min={0}
                    max={warningThreshold - 1}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Batch Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Generation Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Batch Size</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{Math.min(localConfig.batch_size, HARD_BATCH_LIMIT)} questions</span>
                    {localConfig.batch_size > HARD_BATCH_LIMIT && (
                      <Badge variant="secondary" className="text-xs">capped</Badge>
                    )}
                  </div>
                </div>
                <Slider
                  value={[localConfig.batch_size]}
                  onValueChange={([value]) => setLocalConfig({ ...localConfig, batch_size: value })}
                  min={1}
                  max={10}
                  step={1}
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Hard limit: {HARD_BATCH_LIMIT} max per topic for safety
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority Mode</Label>
                <Select 
                  value={localConfig.priority} 
                  onValueChange={(value: 'lowest_first' | 'random') => 
                    setLocalConfig({ ...localConfig, priority: value })
                  }
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lowest_first">Lowest First</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How to prioritize topics in the queue
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Difficulty Distribution Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Difficulty Distribution</h4>
              <Badge variant={isWeightsValid ? "outline" : "destructive"}>
                Total: {weightsTotal}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Control the probability of each difficulty level during auto-generation
            </p>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight-easy" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  Easy
                </Label>
                <Input
                  id="weight-easy"
                  type="number"
                  value={difficultyWeights.easy}
                  onChange={(e) => handleWeightChange('easy', parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                  className="text-center"
                />
                <p className="text-xs text-center text-muted-foreground">{difficultyWeights.easy}%</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weight-medium" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-500" />
                  Medium
                </Label>
                <Input
                  id="weight-medium"
                  type="number"
                  value={difficultyWeights.medium}
                  onChange={(e) => handleWeightChange('medium', parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                  className="text-center"
                />
                <p className="text-xs text-center text-muted-foreground">{difficultyWeights.medium}%</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weight-hard" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  Hard
                </Label>
                <Input
                  id="weight-hard"
                  type="number"
                  value={difficultyWeights.hard}
                  onChange={(e) => handleWeightChange('hard', parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                  className="text-center"
                />
                <p className="text-xs text-center text-muted-foreground">{difficultyWeights.hard}%</p>
              </div>
            </div>
            
            {!isWeightsValid && (
              <p className="text-xs text-destructive">
                ⚠️ Weights must sum to 100%. Currently: {weightsTotal}%
              </p>
            )}
          </div>

          <Separator />

          {/* Data Maintenance Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Data Maintenance</h4>
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <div>
                <p className="font-medium text-sm">Backfill Topic Links</p>
                <p className="text-xs text-muted-foreground">
                  Link existing questions to LMS topics for accurate inventory counts
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleBackfill}
                disabled={isBackfilling}
              >
                {isBackfilling ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                {isBackfilling ? 'Processing...' : 'Run Backfill'}
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AutoFillSettings;
