import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SyllabusSubject } from './interfaces';
import { SyllabusSubjectCard } from './SyllabusSubjectCard';

interface SubjectGridProps {
  subjects: SyllabusSubject[];
  loading: boolean;
  onToggleSubject: (subjectId: string) => void;
  onToggleTopic: (subjectId: string, topicId: string) => void;
  onToggleExpand: (subjectId: string) => void;
  onClearFilters: () => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { y: 10, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export const SubjectGrid = ({
  subjects,
  loading,
  onToggleSubject,
  onToggleTopic,
  onToggleExpand,
  onClearFilters
}: SubjectGridProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground mb-4">
          No subjects found matching your filters.
        </p>
        <Button onClick={onClearFilters}>Clear Filters</Button>
      </Card>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      {subjects.map(subject => (
        <motion.div key={subject.id} variants={item}>
          <SyllabusSubjectCard
            subject={subject}
            onToggleSubject={onToggleSubject}
            onToggleTopic={onToggleTopic}
            onToggleExpand={onToggleExpand}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};
