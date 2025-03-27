
import { Book, Code, Beaker, Brain, Atom, Calculator } from "lucide-react";
import { useState, useEffect } from "react";
import SubjectCard from "@/components/SubjectCard";
import { motion } from "framer-motion";

const subjects = [
  {
    title: "Mathematics",
    icon: <Calculator className="h-6 w-6 text-blue-500" />,
    description: "Algebra, calculus, geometry, and more topics for comprehensive math practice.",
    topicCount: 12,
    color: "#3b82f6",
  },
  {
    title: "Computer Science",
    icon: <Code className="h-6 w-6 text-emerald-500" />,
    description: "Programming, data structures, algorithms, and database concepts.",
    topicCount: 10,
    color: "#10b981",
  },
  {
    title: "Physics",
    icon: <Atom className="h-6 w-6 text-purple-500" />,
    description: "Mechanics, electromagnetism, thermodynamics, and modern physics.",
    topicCount: 8,
    color: "#8b5cf6",
  },
  {
    title: "Chemistry",
    icon: <Beaker className="h-6 w-6 text-red-500" />,
    description: "Organic, inorganic, physical chemistry and biochemistry topics.",
    topicCount: 7,
    color: "#ef4444",
  },
  {
    title: "Biology",
    icon: <Brain className="h-6 w-6 text-green-500" />,
    description: "Cell biology, genetics, ecology, evolution, and human physiology.",
    topicCount: 9,
    color: "#22c55e",
  },
  {
    title: "English",
    icon: <Book className="h-6 w-6 text-orange-500" />,
    description: "Grammar, vocabulary, comprehension, and composition practice.",
    topicCount: 6,
    color: "#f97316",
  },
];

const Subjects = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

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

  return (
    <div className="container mx-auto px-4 pt-28 pb-16">
      <div className="mb-12 text-center">
        <motion.h1 
          className="text-4xl font-bold mb-4"
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

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        variants={container}
        initial="hidden"
        animate={isLoaded ? "show" : "hidden"}
      >
        {subjects.map((subject, index) => (
          <motion.div key={subject.title} variants={item}>
            <SubjectCard
              title={subject.title}
              icon={subject.icon}
              description={subject.description}
              topicCount={subject.topicCount}
              color={subject.color}
              onClick={() => console.log(`Selected subject: ${subject.title}`)}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Subjects;
