import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Sparkles, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { type AutoFillQueueItem, getAutoFillQueue } from "@/services/autoFillService";

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
    
    // TODO: Integrate with actual AI generation edge function
    toast.info(`Generation for "${topic.topic_name}" would start here`, {
      description: 'This will be connected to the AI generation endpoint'
    });
    
    // Simulate delay for demo
    await new Promise(resolve => setTimeout(resolve, 1500));
    setGeneratingTopicId(null);
    
    // Refresh the queue after generation
    onRefresh();
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
            disabled={generatingTopicId !== null}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
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
                disabled={generatingTopicId !== null}
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
