import { motion } from "framer-motion";
import { Subject } from "@/types/subject.types";
import {
  UnifiedSubjectCard,
  UnifiedSubjectModel,
} from "@/components/subjects/UnifiedSubjectCard";
import { GroupedSubjectGrid } from "@/components/subjects/GroupedSubjectGrid";

interface SubjectGridProps {
  subjects: Subject[];
  isLoaded: boolean;
  /** Optional subject-level MCQ counts keyed by subject id. */
  subjectMcqCounts?: Record<string, number>;
}

const SubjectGrid = ({ subjects, isLoaded, subjectMcqCounts = {} }: SubjectGridProps) => {
  if (subjects.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-muted-foreground mb-3">
          No subjects match your search criteria.
        </p>
        <motion.button
          onClick={() => window.location.reload()}
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Reset Filters
        </motion.button>
      </div>
    );
  }

  // Map to the unified model
  const mapped: (UnifiedSubjectModel & { system?: string; level?: string })[] =
    subjects.map((s, i) => ({
      id: s.id || `${s.title}-${i}`,
      name: s.title,
      level: s.levelName,
      levelId: s.levelId,
      system: s.systemName,
      systemId: s.systemId,
      topicCount: s.topicCount || 0,
      mcqCount: s.id ? subjectMcqCounts[s.id] : undefined,
      icon: s.icon,
      description: s.description,
    }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={isLoaded ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <GroupedSubjectGrid
        subjects={mapped}
        groupBy="system"
        renderCard={(subject) => (
          <UnifiedSubjectCard
            variant="navigate"
            subject={subject}
            linkState={{
              title: subject.name,
              id: subject.id,
              subjectId: subject.id,
              levelId: subject.levelId,
              levelName: subject.level,
              systemId: subject.systemId,
              systemName: subject.system,
              topicCount: subject.topicCount,
              mode: "practice",
              purpose: "mcqs",
            }}
          />
        )}
      />
    </motion.div>
  );
};

export default SubjectGrid;
