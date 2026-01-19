import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Sparkles, ChevronRight, Loader2, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { type AutoFillQueueItem, getAutoFillQueue, getAutoFillConfig, generateForTopic, getAIUsageToday } from "@/services/autoFillService";

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
      
      const result = await generateForTopic({
        topic_id: topic.topic_id,
        topic_name: topic.topic_name,
        subject_name: topic.subject_name,
        count: Math.min(batchSize, topic.questions_needed),
        difficulty: 'medium'
      });
      
      if (result.success) {
        toast.success(`Generated ${result.saved} questions for "${topic.topic_name}"`, {
          description: result.duplicates > 0 
            ? `${result.duplicates} duplicates flagged for review` 
            : undefined
        });
      } else {
        toast.error(`Generation failed: ${result.error}`);
      }
    } catch (error) {
      toast.error('Failed to generate questions');
      console.error('Generation error:', error);
    } finally {
      setGeneratingTopicId(null);
      onRefresh();
    }
  };

  const handleAutoPilot = async () => {
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

      // CONTINUOUS LOOP - runs until limit hit or no gaps
      while (true) {
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

        // Step 3: Generate for this topic
        setAutoPilotProgress({
          topicsProcessed,
          totalQuestionsSaved,
          currentTopicName: topic.topic_name,
          status: `Generating for "${topic.topic_name}"...`
        });

        const result = await generateForTopic({
          topic_id: topic.topic_id,
          topic_name: topic.topic_name,
          subject_name: topic.subject_name,
          count: Math.min(batchSize, topic.questions_needed),
          difficulty: 'medium'
        });

        if (result.success) {
          topicsProcessed++;
          totalQuestionsSaved += result.saved;
          
          setAutoPilotProgress({
            topicsProcessed,
            totalQuestionsSaved,
            currentTopicName: topic.topic_name,
            status: `✓ Filled gap for "${topic.topic_name}"... Checking next...`
          });
        } else {
          // Check for limit errors
          if (result.error?.toLowerCase().includes('limit') || 
              result.error?.toLowerCase().includes('quota')) {
            toast.warning('Daily Limit Reached!', {
              description: `Auto-pilot stopped. Processed ${topicsProcessed} topics, saved ${totalQuestionsSaved} questions.`
            });
            break;
          }
          // Log other errors but continue to next topic
          console.error(`Failed for ${topic.topic_name}:`, result.error);
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
          <Button 
            variant={isAutoPilotRunning ? "outline" : "default"}
            size="sm"
            onClick={handleAutoPilot}
            disabled={generatingTopicId !== null || isAutoPilotRunning}
            className={isAutoPilotRunning ? "border-amber-500 text-amber-500" : ""}
          >
            {isAutoPilotRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Start Auto-Pilot
              </>
            )}
          </Button>
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
