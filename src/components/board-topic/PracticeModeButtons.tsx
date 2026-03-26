import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Zap, Timer } from 'lucide-react';

interface PracticeModeButtonsProps {
  subjectId: string;
  topicName: string;
}

const PracticeModeButtons = ({ subjectId, topicName }: PracticeModeButtonsProps) => {
  const encodedTopic = encodeURIComponent(topicName);

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <Link to={`/subject/${subjectId}?topic=${encodedTopic}&count=10`}>
        <Button variant="outline" className="gap-2">
          <Zap className="h-4 w-4" />
          Quick Test (10 Qs)
        </Button>
      </Link>
      <Link to={`/subject/${subjectId}?topic=${encodedTopic}&count=50&timed=true`}>
        <Button className="gap-2">
          <Timer className="h-4 w-4" />
          Full Simulation
        </Button>
      </Link>
    </div>
  );
};

export default PracticeModeButtons;
