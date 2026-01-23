import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Sparkles, ChevronRight, Loader2, Zap, StopCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { type AutoFillQueueItem, type DifficultyWeights, getAutoFillQueue, getAutoFillConfig, generateForTopic, getAIUsageToday } from "@/services/autoFillService";

interface ContentGapQueueProps {
  topPriorityTopics: AutoFillQueueItem[];
  totalCount: number;
  onRefresh: () => void;
}

const ContentGapQueue = ({ topPriorityTopics, totalCount, onRefresh }: ContentGapQueueProps) => {
  const [expandedQueue, setExpandedQueue] = useState<AutoFillQueueItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [generatingTopicId, setGeneratingTopicId] = useState<string | null>(null);
  const [isAutoPilotRunning, setIsAutoPilotRunning] = useState(false);
  const [autoPilotProgress, setAutoPilotProgress] = useState({
    topicsProcessed: 0,
    totalQuestionsSaved: 0,
    currentTopicName: '',
    status: ''
  });
  
  // Ref to track if auto-pilot should be stopped
  const shouldStopAutoPilot = useRef(false);

  // Difficulty levels for weighted random selection
  const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'] as const;
  type DifficultyLevel = typeof DIFFICULTY_LEVELS[number];

  const DEFAULT_WEIGHTS: DifficultyWeights = { easy: 20, medium: 60, hard: 20 };

  const getWeightedRandomDifficulty = (weights: DifficultyWeights = DEFAULT_WEIGHTS): DifficultyLevel => {
    const totalWeight = weights.easy + weights.medium + weights.hard;
    const random = Math.random() * totalWeight;
    
    if (random < weights.easy) return 'easy';
    if (random < weights.easy + weights.medium) return 'medium';
    return 'hard';
  };

  const displayedTopics = isExpanded ? expandedQueue : topPriorityTopics;

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const fullQueue = await getAutoFillQueue(50);
      setExpandedQueue(fullQueue);
      setIsExpanded(true);
    } catch (error) {
      toast.error('Failed to load more topics');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleGenerateForTopic = async (topic: AutoFillQueueItem) => {
    setGeneratingTopicId(topic.topic_id);
    
    try {
      const config = await getAutoFillConfig();
      const batchSize = config?.batch_size || 20;
      const weights = config?.difficulty_weights || DEFAULT_WEIGHTS;
      const randomDifficulty = getWeightedRandomDifficulty(weights);
      
      const result = await generateForTopic({
        topic_id: topic.topic_id,
        topic_name: topic.topic_name,
        subject_name: topic.subject_name,
        count: Math.min(batchSize, topic.questions_needed),
        difficulty: randomDifficulty
      });
      
      if (result.success) {
        const difficultyLabel = randomDifficulty.charAt(0).toUpperCase() + randomDifficulty.slice(1);
        toast.success(`Generated ${result.saved} ${difficultyLabel} questions for "${topic.topic_name}"`, {
          description: result.duplicates > 0 
            ? `${result.duplicates} duplicates flagged for review` 
            : undefined
        });
      } else {
        // Show detailed error with type indication
        const errorIcon = result.errorType === 'quota' ? '💳' 
          : result.errorType === 'timeout' ? '⏱️' 
          : result.errorType === 'gateway' ? '🔌' 
          : result.errorType === 'auth' ? '🔐' 
          : '❌';
        
        toast.error(`${errorIcon} Generation Failed`, {
          description: result.error,
          duration: 8000, // Keep visible longer for debugging
        });
        console.error('[Manual Generation] Error details:', { topic: topic.topic_name, ...result });
      }
    } catch (error: any) {
      toast.error('❌ Unexpected Error', {
        description: error?.message || 'Failed to generate questions',
        duration: 8000,
      });
      console.error('[Manual Generation] Unexpected error:', error);
    } finally {
      setGeneratingTopicId(null);
      onRefresh();
    }
  };

  const handleStopAutoPilot = () => {
    shouldStopAutoPilot.current = true;
    setAutoPilotProgress(prev => ({
      ...prev,
      status: 'Stopping auto-pilot...'
    }));
    toast.info('Stopping auto-pilot...', {
      description: 'Will stop after the current topic completes.'
    });
  };

  const handleAutoPilot = async () => {
    shouldStopAutoPilot.current = false;
    setIsAutoPilotRunning(true);
    setAutoPilotProgress({ 
      topicsProcessed: 0, 
      totalQuestionsSaved: 0, 
      currentTopicName: '', 
      status: 'Starting auto-pilot...' 
    });

    let topicsProcessed = 0;
    let totalQuestionsSaved = 0;

    try {
      const config = await getAutoFillConfig();
      const batchSize = config?.batch_size || 20;

      // CONTINUOUS LOOP - runs until limit hit, no gaps, or manually stopped
      while (true) {
        // Check if manually stopped
        if (shouldStopAutoPilot.current) {
          toast.success('Auto-Pilot Stopped', {
            description: `Manually stopped. Processed ${topicsProcessed} topics, saved ${totalQuestionsSaved} questions.`
          });
          break;
        }

        // Step 1: Check daily usage quota
        setAutoPilotProgress(prev => ({ 
          ...prev, 
          status: 'Checking API quota...' 
        }));
        
        const usage = await getAIUsageToday();
        
        if (!usage || usage.remaining_requests <= 0) {
          toast.warning('Daily Limit Reached!', {
            description: `Auto-pilot stopped automatically. Processed ${topicsProcessed} topics, saved ${totalQuestionsSaved} questions.`
          });
          break;
        }

        // Step 2: Fetch the SINGLE top-priority gap
        setAutoPilotProgress(prev => ({ 
          ...prev, 
          status: 'Finding next content gap...' 
        }));
        
        const queue = await getAutoFillQueue(1);
        
        if (queue.length === 0) {
          toast.success('All Topics Fully Stocked!', {
            description: `Mission complete! Processed ${topicsProcessed} topics, saved ${totalQuestionsSaved} questions.`
          });
          break;
        }

        const topic = queue[0];

        // Weighted random difficulty selection
        const weights = config?.difficulty_weights || DEFAULT_WEIGHTS;
        const randomDifficulty = getWeightedRandomDifficulty(weights);
        const difficultyLabel = randomDifficulty.charAt(0).toUpperCase() + randomDifficulty.slice(1);

        // Step 3: Generate for this topic with random difficulty
        setAutoPilotProgress({
          topicsProcessed,
          totalQuestionsSaved,
          currentTopicName: topic.topic_name,
          status: `Generating (${difficultyLabel}) for "${topic.topic_name}"...`
        });

        const result = await generateForTopic({
          topic_id: topic.topic_id,
          topic_name: topic.topic_name,
          subject_name: topic.subject_name,
          count: Math.min(batchSize, topic.questions_needed),
          difficulty: randomDifficulty
        });

        if (result.success) {
          topicsProcessed++;
          totalQuestionsSaved += result.saved;
          
          setAutoPilotProgress({
            topicsProcessed,
            totalQuestionsSaved,
            currentTopicName: topic.topic_name,
            status: `✓ Filled gap (${difficultyLabel}) for "${topic.topic_name}"... Checking next...`
          });
        } else {
          // Detailed error handling with type-specific messages
          const errorIcon = result.errorType === 'quota' ? '💳' 
            : result.errorType === 'timeout' ? '⏱️' 
            : result.errorType === 'gateway' ? '🔌' 
            : result.errorType === 'auth' ? '🔐' 
            : '❌';

          // Check for limit/quota errors - stop auto-pilot
          if (result.errorType === 'quota' || 
              result.error?.toLowerCase().includes('limit') || 
              result.error?.toLowerCase().includes('quota') ||
              result.error?.toLowerCase().includes('credit')) {
            toast.error(`${errorIcon} Credits/Quota Exhausted`, {
              description: result.error,
              duration: 10000,
            });
            setAutoPilotProgress(prev => ({
              ...prev,
              status: `⛔ Stopped: ${result.error}`
            }));
            break;
          }

          // Check for gateway/timeout errors - show error, retry after delay
          if (result.errorType === 'gateway' || result.errorType === 'timeout') {
            toast.error(`${errorIcon} API Error - Retrying`, {
              description: `${result.error}. Retrying in 5s...`,
              duration: 5000,
            });
            setAutoPilotProgress(prev => ({
              ...prev,
              status: `⚠️ Error: ${result.error}. Retrying in 5s...`
            }));
            // Wait 5 seconds before retry
            await new Promise(resolve => setTimeout(resolve, 5000));
            continue; // Retry same topic
          }

          // Auth errors - stop immediately
          if (result.errorType === 'auth') {
            toast.error(`${errorIcon} Authentication Failed`, {
              description: result.error,
              duration: 10000,
            });
            setAutoPilotProgress(prev => ({
              ...prev,
              status: `🔐 Auth Error: ${result.error}`
            }));
            break;
          }

          // Unknown errors - log and continue to next topic
          toast.warning(`${errorIcon} Skipping Topic`, {
            description: `${topic.topic_name}: ${result.error}`,
            duration: 5000,
          });
          console.error(`[Auto-Pilot] Failed for ${topic.topic_name}:`, result);
        }

        // Small delay to prevent hammering the API
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error: any) {
      if (error?.message?.toLowerCase().includes('limit')) {
        toast.warning('Daily Limit Reached!');
      } else {
        toast.error('Auto-pilot encountered an error', {
          description: error?.message || 'Unknown error'
        });
      }
    } finally {
      shouldStopAutoPilot.current = false;
      setIsAutoPilotRunning(false);
      setAutoPilotProgress({ 
        topicsProcessed: 0, 
        totalQuestionsSaved: 0, 
        currentTopicName: '', 
        status: '' 
      });
      onRefresh();
    }
  };

  const getUrgencyColor = (currentCount: number): string => {
    if (currentCount === 0) return 'text-destructive';
    if (currentCount < 5) return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  const getUrgencyBadge = (currentCount: number) => {
    if (currentCount === 0) return <Badge variant="destructive">Critical</Badge>;
    if (currentCount < 5) return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Low</Badge>;
    return <Badge variant="secondary">Below Threshold</Badge>;
  };

  if (topPriorityTopics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-green-500" />
            Content Coverage Complete
          </CardTitle>
          <CardDescription>
            All topics meet the minimum question threshold. Great job!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Priority Queue
            </CardTitle>
            <CardDescription>
              Topics that need content generation ({totalCount} total)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isAutoPilotRunning ? (
              <Button 
                variant="destructive"
                size="sm"
                onClick={handleStopAutoPilot}
              >
                <StopCircle className="h-4 w-4 mr-2" />
                Stop Auto-Pilot
              </Button>
            ) : (
              <Button 
                variant="default"
                size="sm"
                onClick={handleAutoPilot}
                disabled={generatingTopicId !== null}
              >
                <Zap className="h-4 w-4 mr-2" />
                Start Auto-Pilot
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isAutoPilotRunning && (
          <div className="mb-4 p-4 bg-gradient-to-r from-amber-500/10 to-primary/10 rounded-lg border border-amber-500/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="relative">
                <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
              </div>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                Auto-Pilot Active
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {autoPilotProgress.status}
            </p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-2 bg-background/50 rounded">
                <div className="text-xs text-muted-foreground">Topics Filled</div>
                <div className="text-lg font-bold">{autoPilotProgress.topicsProcessed}</div>
              </div>
              <div className="p-2 bg-background/50 rounded">
                <div className="text-xs text-muted-foreground">Questions Saved</div>
                <div className="text-lg font-bold">{autoPilotProgress.totalQuestionsSaved}</div>
              </div>
            </div>
          </div>
        )}
        <div className="space-y-3">
          {displayedTopics.map((topic, index) => (
            <motion.div
              key={topic.topic_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate">{topic.topic_name}</span>
                  {getUrgencyBadge(topic.current_count)}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="truncate">
                    {topic.system_name} → {topic.level_name} → {topic.subject_name}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Progress 
                    value={(topic.current_count / 10) * 100} 
                    className="h-1.5 flex-1 max-w-[100px]" 
                  />
                  <span className={`text-xs font-medium ${getUrgencyColor(topic.current_count)}`}>
                    {topic.current_count}/10
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (+{topic.questions_needed} needed)
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-4 shrink-0"
                onClick={() => handleGenerateForTopic(topic)}
                disabled={generatingTopicId !== null || isAutoPilotRunning}
              >
                {generatingTopicId === topic.topic_id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-1" />
                    Generate
                  </>
                )}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Load More Button */}
        {!isExpanded && totalCount > 5 && (
          <div className="mt-4 flex justify-center">
            <Button 
              variant="ghost" 
              onClick={handleLoadMore}
              disabled={isLoadingMore || isAutoPilotRunning}
            >
              {isLoadingMore ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-2" />
              )}
              Show {totalCount - 5} more topics
            </Button>
          </div>
        )}

        {isExpanded && (
          <div className="mt-4 flex justify-center">
            <Button 
              variant="ghost" 
              onClick={() => setIsExpanded(false)}
              disabled={isAutoPilotRunning}
            >
              Show less
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContentGapQueue;
