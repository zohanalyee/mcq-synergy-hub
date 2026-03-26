import { Badge } from '@/components/ui/badge';
import { BookOpen, BarChart3, Users } from 'lucide-react';

interface MCQ {
  difficulty?: string | null;
}

interface TopicStatsBarProps {
  mcqs: MCQ[];
  practiceCount?: number;
}

const TopicStatsBar = ({ mcqs, practiceCount = 0 }: TopicStatsBarProps) => {
  const total = mcqs.length;
  const easy = mcqs.filter(m => m.difficulty === 'Easy').length;
  const medium = mcqs.filter(m => m.difficulty === 'Medium').length;
  const hard = mcqs.filter(m => m.difficulty === 'Hard').length;

  if (total === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <Badge variant="secondary" className="gap-1.5 text-xs">
        <BookOpen className="h-3 w-3" /> {total} MCQs
      </Badge>
      {easy > 0 && (
        <Badge variant="outline" className="gap-1 text-xs text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
          🟢 {easy} Easy
        </Badge>
      )}
      {medium > 0 && (
        <Badge variant="outline" className="gap-1 text-xs text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800">
          🟡 {medium} Medium
        </Badge>
      )}
      {hard > 0 && (
        <Badge variant="outline" className="gap-1 text-xs text-red-600 border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
          🔴 {hard} Hard
        </Badge>
      )}
      {practiceCount > 0 && (
        <Badge variant="outline" className="gap-1 text-xs">
          <Users className="h-3 w-3" /> {practiceCount} practiced
        </Badge>
      )}
    </div>
  );
};

export default TopicStatsBar;
