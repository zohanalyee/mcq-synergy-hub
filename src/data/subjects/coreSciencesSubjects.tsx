
import { Book, Code, Beaker, Brain, Atom, Calculator } from "lucide-react";
import { Subject } from "@/types/subject.types";

export const coreSciencesSubjects: Subject[] = [
  {
    title: "Mathematics",
    icon: <Calculator className="h-6 w-6 text-blue-500" />,
    description: "Algebra, calculus, geometry, and more topics for comprehensive math practice.",
    topicCount: 12,
    color: "#3b82f6",
    category: "Core Sciences",
    purpose: "mcqs"
  },
  {
    title: "Computer Science",
    icon: <Code className="h-6 w-6 text-emerald-500" />,
    description: "Programming, data structures, algorithms, and database concepts.",
    topicCount: 10,
    color: "#10b981",
    category: "Core Sciences",
    purpose: "mcqs"
  },
  {
    title: "Physics",
    icon: <Atom className="h-6 w-6 text-purple-500" />,
    description: "Mechanics, electromagnetism, thermodynamics, and modern physics.",
    topicCount: 8,
    color: "#8b5cf6",
    category: "Core Sciences",
    purpose: "reading"
  },
  {
    title: "Chemistry",
    icon: <Beaker className="h-6 w-6 text-red-500" />,
    description: "Organic, inorganic, physical chemistry and biochemistry topics.",
    topicCount: 7,
    color: "#ef4444",
    category: "Core Sciences",
    purpose: "mcqs"
  },
  {
    title: "Biology",
    icon: <Brain className="h-6 w-6 text-green-500" />,
    description: "Cell biology, genetics, ecology, evolution, and human physiology.",
    topicCount: 9,
    color: "#22c55e",
    category: "Core Sciences",
    purpose: "reading"
  },
  {
    title: "English",
    icon: <Book className="h-6 w-6 text-orange-500" />,
    description: "Grammar, vocabulary, comprehension, and composition practice.",
    topicCount: 6,
    color: "#f97316",
    category: "Core Sciences",
    purpose: "reading"
  }
];
