import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSafe } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface TopicProgressCardProps {
  topicName: string;
  subjectName: string;
}

const TopicProgressCard = ({ topicName, subjectName }: TopicProgressCardProps) => {
  const { user } = useAuthSafe();

  const { data: progress } = useQuery({
    queryKey: ['topic-progress', user?.id, topicName, subjectName],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('test_attempts')
        .select('score, total_questions, completed_at')
        .eq('user_id', user.id)
        .contains('subjects', [subjectName]);

      if (!data || data.length === 0) return null;

      const totalScore = data.reduce((sum, a) => sum + (a.score || 0), 0);
      const totalQs = data.reduce((sum, a) => sum + (a.total_questions || 0), 0);
      const accuracy = totalQs > 0 ? Math.round((totalScore / totalQs) * 100) : 0;
      const lastDate = data
        .map(a => a.completed_at)
        .filter(Boolean)
        .sort()
        .reverse()[0];

      return { tests: data.length, accuracy, lastPracticed: lastDate };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  if (!user) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 mb-4">
        <LogIn className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          <Link to="/auth" className="text-primary hover:underline font-medium">Sign in</Link> to track your progress
        </span>
      </div>
    );
  }

  if (!progress) return null;

  return (
    <div className="p-4 rounded-lg border border-border bg-card mb-4">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Your Progress</h3>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
        <span>{progress.tests} test{progress.tests !== 1 ? 's' : ''} taken</span>
        <span>{progress.accuracy}% accuracy</span>
        {progress.lastPracticed && (
          <span>Last: {new Date(progress.lastPracticed).toLocaleDateString()}</span>
        )}
      </div>
      <Progress value={progress.accuracy} className="h-2" />
    </div>
  );
};

export default TopicProgressCard;
