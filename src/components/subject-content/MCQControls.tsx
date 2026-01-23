import { RefreshCw, Sparkles, Database, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface TopicOption {
  id: string;
  name: string;
}

interface MCQControlsProps {
  questionCount: string;
  difficulty: string;
  selectedTopicId: string;
  topics: TopicOption[];
  onQuestionCountChange: (value: string) => void;
  onDifficultyChange: (value: string) => void;
  onTopicChange: (value: string) => void;
  onRefresh: () => void;
  onGenerate: () => void;
  isLoading: boolean;
  questionSource: 'cache' | 'ai' | 'hybrid' | null;
  totalQuestions: number;
  cachedCount?: number;
  aiCount?: number;
}

const MCQControls = ({
  questionCount,
  difficulty,
  selectedTopicId,
  topics,
  onQuestionCountChange,
  onDifficultyChange,
  onTopicChange,
  onRefresh,
  onGenerate,
  isLoading,
  questionSource,
  totalQuestions,
  cachedCount = 0,
  aiCount = 0,
}: MCQControlsProps) => {
  const getSourceBadge = () => {
    if (!questionSource) return null;
    
    switch (questionSource) {
      case 'cache':
        return (
          <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            <Database className="w-3 h-3" />
            <span>⚡ From Bank ({cachedCount})</span>
          </Badge>
        );
      case 'ai':
        return (
          <Badge variant="secondary" className="gap-1 bg-purple-500/10 text-purple-600 border-purple-500/20">
            <Sparkles className="w-3 h-3" />
            <span>🤖 AI Generated ({aiCount})</span>
          </Badge>
        );
      case 'hybrid':
        return (
          <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
            <Zap className="w-3 h-3" />
            <span>🔀 Mixed ({cachedCount} bank + {aiCount} AI)</span>
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 rounded-xl bg-secondary/30 border border-border/50">
      <div className="flex flex-wrap items-center gap-3">
        {/* Topic Selector */}
        <Select value={selectedTopicId} onValueChange={onTopicChange}>
          <SelectTrigger className="w-[160px] bg-background">
            <SelectValue placeholder="Select Topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            {topics.map((topic) => (
              <SelectItem key={topic.id} value={topic.id}>
                {topic.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={questionCount} onValueChange={onQuestionCountChange}>
          <SelectTrigger className="w-[130px] bg-background">
            <SelectValue placeholder="Questions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 Questions</SelectItem>
            <SelectItem value="20">20 Questions</SelectItem>
            <SelectItem value="30">30 Questions</SelectItem>
            <SelectItem value="50">50 Questions</SelectItem>
          </SelectContent>
        </Select>

        <Select value={difficulty} onValueChange={onDifficultyChange}>
          <SelectTrigger className="w-[120px] bg-background">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={onGenerate}
          disabled={isLoading}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Generate New
        </Button>
      </div>

      <div className="flex items-center gap-3">
        {totalQuestions > 0 && (
          <span className="text-sm text-muted-foreground">
            {totalQuestions} questions loaded
          </span>
        )}
        {getSourceBadge()}
      </div>
    </div>
  );
};

export default MCQControls;
