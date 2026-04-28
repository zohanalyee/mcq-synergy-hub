import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SyllabusSubject } from './interfaces';
import { UnifiedSubjectCard } from '@/components/subjects/UnifiedSubjectCard';
import { GroupedSubjectGrid } from '@/components/subjects/GroupedSubjectGrid';

interface SubjectGridProps {
  subjects: SyllabusSubject[];
  loading: boolean;
  topicQuestionCounts?: Record<string, number>;
  onToggleSubject: (subjectId: string) => void;
  onToggleTopic: (subjectId: string, topicId: string) => void;
  onToggleExpand: (subjectId: string) => void;
  onClearFilters: () => void;
}

export const SubjectGrid = ({
  subjects,
  loading,
  topicQuestionCounts = {},
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
      <Card className="p-6 text-center rounded-2xl">
        <p className="text-sm text-muted-foreground mb-3">
          No subjects found matching your filters.
        </p>
        <Button size="sm" onClick={onClearFilters}>Clear Filters</Button>
      </Card>
    );
  }

  // Map syllabus subjects to the unified model shape
  const mapped = subjects.map((s) => {
    const totalMcqs = s.topics.reduce(
      (sum, t) => sum + (topicQuestionCounts[t.id] || 0),
      0
    );
    const selectedTopicsCount = s.topics.filter((t) => t.isSelected).length;
    const allSelected =
      s.topics.length > 0 && selectedTopicsCount === s.topics.length;
    const someSelected =
      selectedTopicsCount > 0 && selectedTopicsCount < s.topics.length;

    return {
      raw: s,
      model: {
        id: s.id,
        name: s.name,
        level: s.levelName,
        system: s.systemName,
        topicCount: s.topics.length,
        mcqCount: totalMcqs,
        topics: s.topics.map((t) => ({
          id: t.id,
          name: t.name,
          isSelected: t.isSelected,
        })),
        description: s.description,
      },
      selection: {
        isSelected: allSelected,
        isIndeterminate: someSelected,
        isExpanded: s.isExpanded,
        onToggleSubject,
        onToggleTopic,
        onToggleExpand,
        topicQuestionCounts,
      },
    };
  });

  return (
    <GroupedSubjectGrid
      subjects={mapped.map((m) => m.model)}
      groupBy="system"
      gridClassName="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 items-start"
      renderCard={(subject) => {
        const entry = mapped.find((m) => m.model.id === subject.id)!;
        return (
          <UnifiedSubjectCard
            variant="select"
            subject={entry.model}
            selection={entry.selection}
          />
        );
      }}
    />
  );
};
