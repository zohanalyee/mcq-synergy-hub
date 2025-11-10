
import { motion } from "framer-motion";

const SubjectsHeader = () => {
  return (
    <div className="mb-12 text-center">
      <motion.h1 
        className="text-4xl font-bold mb-4 text-foreground"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Explore Subjects
      </motion.h1>
      <motion.p 
        className="text-muted-foreground max-w-2xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Choose from a variety of subjects to create your custom MCQ test syllabus. Each subject contains numerous topics and subtopics.
      </motion.p>
    </div>
  );
};

export default SubjectsHeader;
