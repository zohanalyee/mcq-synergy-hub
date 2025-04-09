
import { CustomSubject, Topic } from "./interfaces";

export const generateTopicsForSubject = (subjectTitle: string, count: number): Topic[] => {
  const subjectTopicMap: Record<string, string[]> = {
    "Mathematics": [
      "Algebra", "Calculus", "Geometry", "Trigonometry", "Statistics", 
      "Linear Algebra", "Number Theory", "Discrete Mathematics", 
      "Mathematical Logic", "Differential Equations", "Complex Analysis",
      "Probability Theory"
    ],
    "Computer Science": [
      "Data Structures", "Algorithms", "Object-Oriented Programming", 
      "Database Systems", "Computer Networks", "Operating Systems", 
      "Software Engineering", "Web Development", "Machine Learning", 
      "Computer Architecture"
    ],
    "Physics": [
      "Mechanics", "Electromagnetism", "Thermodynamics", "Quantum Mechanics", 
      "Relativity", "Optics", "Nuclear Physics", "Fluid Mechanics"
    ],
    "Chemistry": [
      "Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", 
      "Biochemistry", "Analytical Chemistry", "Environmental Chemistry", 
      "Polymer Chemistry"
    ],
    "Biology": [
      "Cell Biology", "Genetics", "Ecology", "Evolution", "Molecular Biology", 
      "Microbiology", "Physiology", "Zoology", "Botany"
    ],
    "English": [
      "Grammar", "Vocabulary", "Reading Comprehension", "Writing", 
      "Literature Analysis", "Critical Reading"
    ],
    "Psychology": [
      "Clinical Psychology", "Cognitive Psychology", "Developmental Psychology", 
      "Social Psychology", "Abnormal Psychology", "Neuropsychology", 
      "Personality Psychology", "Behavioral Psychology"
    ]
  };
  
  const specificTopics = subjectTopicMap[subjectTitle] || [];
  
  if (specificTopics.length >= count) {
    return specificTopics.slice(0, count).map((topic, i) => ({
      id: `${subjectTitle.toLowerCase().replace(/\s+/g, '-')}-topic-${i + 1}`,
      name: topic,
      selected: false
    }));
  } else {
    return Array.from({ length: count }, (_, i) => ({
      id: `${subjectTitle.toLowerCase().replace(/\s+/g, '-')}-topic-${i + 1}`,
      name: specificTopics[i] || `${subjectTitle} Topic ${i + 1}`,
      selected: false
    }));
  }
};

export const getCategories = (subjects: any[]) => {
  const categories = subjects.map(subject => subject.category);
  return ["All", ...Array.from(new Set(categories))];
};
