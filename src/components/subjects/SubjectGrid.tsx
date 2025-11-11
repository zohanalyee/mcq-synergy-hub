
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
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  if (subjects.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">No subjects match your search criteria.</p>
        <motion.button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
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
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 w-full"
      variants={container}
      initial="hidden"
      animate={isLoaded ? "show" : "hidden"}
    >
      {subjects.map((subject) => (
        <motion.div key={subject.title} variants={item}>
          <SubjectCard
            title={subject.title}
            icon={subject.icon}
            description={subject.description}
            topicCount={subject.topicCount || 0}
            color={subject.color}
            purpose={subject.purpose}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default SubjectGrid;
