import { useState } from "react";
import { motion } from "framer-motion";
import { Save, X, Database, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  updateAutoFillConfig, 
  updateAILimitConfig,
  updateLowContentThreshold,
  getAutoFillConfig,
  getAILimitConfig,
  getLowContentThreshold,
  backfillTopicIds,
  type AutoFillConfig 
} from "@/services/autoFillService";

interface AutoFillSettingsProps {
  config: AutoFillConfig | null;
  onConfigUpdate: (config: AutoFillConfig) => void;
  onClose: () => void;
}

const AutoFillSettings = ({ config, onConfigUpdate, onClose }: AutoFillSettingsProps) => {
  const [localConfig, setLocalConfig] = useState<AutoFillConfig>(config || {
    enabled: false,
    min_threshold: 10,
    batch_size: 20,
    priority: 'lowest_first'
  });
  
  const [dailyLimit, setDailyLimit] = useState(50);
  const [warningThreshold, setWarningThreshold] = useState(10);
  const [criticalThreshold, setCriticalThreshold] = useState(5);
  const [isSaving, setIsSaving] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false);

  // Load additional settings on mount
  useState(() => {
    const loadSettings = async () => {
      const [limitConfig, thresholdConfig] = await Promise.all([
        getAILimitConfig(),
        getLowContentThreshold()
      ]);
      
      if (limitConfig) setDailyLimit(limitConfig.max_requests);
      if (thresholdConfig) {
        setWarningThreshold(thresholdConfig.warning);
        setCriticalThreshold(thresholdConfig.critical);
      }
    };
    loadSettings();
  });

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const results = await Promise.all([
        updateAutoFillConfig(localConfig),
        updateAILimitConfig({ max_requests: dailyLimit }),
        updateLowContentThreshold({ warning: warningThreshold, critical: criticalThreshold })
      ]);
      
      if (results.every(r => r)) {
        toast.success('Settings saved successfully');
        onConfigUpdate(localConfig);
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
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
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
                  <span className="text-sm font-medium">{localConfig.batch_size} questions</span>
                </div>
                <Slider
                  value={[localConfig.batch_size]}
                  onValueChange={([value]) => setLocalConfig({ ...localConfig, batch_size: value })}
                  min={5}
                  max={50}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  Questions generated per topic per request
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
