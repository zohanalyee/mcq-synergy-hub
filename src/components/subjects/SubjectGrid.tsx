
import { motion } from "framer-motion";
import { Subject } from "@/types/subject.types";
import SubjectCard from "@/components/SubjectCard";

interface SubjectGridProps {
  subjects: Subject[];
  isLoaded: boolean;
}

const SubjectGrid = ({ subjects, isLoaded }: SubjectGridProps) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
      },
    },
  };

  const item = {
    hidden: { opacity: 0 },
    show: { opacity: 1 },
  };

  if (subjects.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-muted-foreground mb-3">No subjects match your search criteria.</p>
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

  return (
    <motion.div 
      className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 w-full"
      variants={container}
      initial="hidden"
      animate={isLoaded ? "show" : "hidden"}
    >
      {subjects.map((subject, index) => (
        <motion.div key={subject.id || `${subject.title}-${index}`} variants={item}>
          <SubjectCard
            title={subject.title}
            icon={subject.icon}
            description={subject.description}
            topicCount={subject.topicCount || 0}
            color={subject.color}
            purpose={subject.purpose}
            id={subject.id}
            levelId={subject.levelId}
            levelName={subject.levelName}
            systemId={subject.systemId}
            systemName={subject.systemName}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default SubjectGrid;
