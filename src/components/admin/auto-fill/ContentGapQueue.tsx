import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Sparkles, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { type AutoFillQueueItem, getAutoFillQueue, getAutoFillConfig, generateForTopic } from "@/services/autoFillService";

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
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, topicName: '' });

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
      // Get batch size from config
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

  const handleGenerateAll = async () => {
    const topicsToProcess = displayedTopics.slice(0, 5);
    
    if (topicsToProcess.length === 0) {
      toast.warning('No topics in queue to generate');
      return;
    }

    setIsBulkGenerating(true);
    setBulkProgress({ current: 0, total: topicsToProcess.length, topicName: '' });

    let totalSaved = 0;
    let totalDuplicates = 0;
    let successfulTopics = 0;
    let stoppedEarly = false;

    try {
      const config = await getAutoFillConfig();
      const batchSize = config?.batch_size || 20;

      for (let i = 0; i < topicsToProcess.length; i++) {
        const topic = topicsToProcess[i];
        
        setBulkProgress({ 
          current: i + 1, 
          total: topicsToProcess.length, 
          topicName: topic.topic_name 
        });

        try {
          const result = await generateForTopic({
            topic_id: topic.topic_id,
            topic_name: topic.topic_name,
            subject_name: topic.subject_name,
            count: Math.min(batchSize, topic.questions_needed),
            difficulty: 'medium'
          });

          if (result.success) {
            totalSaved += result.saved;
            totalDuplicates += result.duplicates;
            successfulTopics++;
          } else {
            if (result.error?.toLowerCase().includes('limit') || 
                result.error?.toLowerCase().includes('quota')) {
              toast.warning('Daily limit reached', {
                description: `Stopped after processing ${i + 1} of ${topicsToProcess.length} topics`
              });
              stoppedEarly = true;
              break;
            }
            console.error(`Failed for topic ${topic.topic_name}:`, result.error);
          }
        } catch (error: any) {
          if (error?.message?.toLowerCase().includes('limit')) {
            toast.warning('Daily limit reached', {
              description: `Stopped after processing ${i + 1} topics`
            });
            stoppedEarly = true;
            break;
          }
          console.error(`Error generating for ${topic.topic_name}:`, error);
        }
      }

      if (!stoppedEarly) {
        toast.success(`Bulk generation complete!`, {
          description: `Generated ${totalSaved} questions across ${successfulTopics} topics` +
            (totalDuplicates > 0 ? `. ${totalDuplicates} duplicates flagged.` : '')
        });
      }

    } catch (error) {
      toast.error('Bulk generation failed', {
        description: 'An unexpected error occurred'
      });
      console.error('Bulk generation error:', error);
    } finally {
      setIsBulkGenerating(false);
      setBulkProgress({ current: 0, total: 0, topicName: '' });
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
            variant="default" 
            size="sm"
            onClick={handleGenerateAll}
            disabled={generatingTopicId !== null || isBulkGenerating}
          >
            {isBulkGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {bulkProgress.current}/{bulkProgress.total}...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate All
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isBulkGenerating && (
          <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>
                Processing topic {bulkProgress.current} of {bulkProgress.total}: 
                <span className="font-medium ml-1">{bulkProgress.topicName}</span>
              </span>
            </div>
            <Progress 
              value={(bulkProgress.current / bulkProgress.total) * 100} 
              className="h-1.5 mt-2" 
            />
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
                disabled={generatingTopicId !== null || isBulkGenerating}
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
              disabled={isLoadingMore}
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
