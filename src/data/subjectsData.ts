
import { BookOpen, Calculator, FlaskConical, Globe, Binary, ServerIcon, Dna, Leaf, Network, BookIcon, LineChart, Microscope, Atom } from "lucide-react";
import { ReactNode } from 'react';

export interface Subject {
  title: string;
  description: string;
  category: string;
  purpose: 'reading' | 'mcqs';
  icon: ReactNode; // Changed from optional to required
  color: string;
  topicCount?: number;
}

export const subjects: Subject[] = [
  {
    title: "mathematics",
    description: "Mathematics is the study of numbers, quantities, and shapes, fundamental for quantitative reasoning.",
    category: "Core Sciences",
    color: "#3b82f6", // blue-500
    purpose: "mcqs",
    topicCount: 3,
    icon: <Calculator className="h-6 w-6" /> // Added icon
  },
  {
    title: "physics",
    description: "Physics explores matter, energy, and their interactions. It seeks to understand the fundamental laws of the universe.",
    category: "Core Sciences",
    color: "#8b5cf6", // violet-500
    purpose: "mcqs",
    topicCount: 2,
    icon: <Atom className="h-6 w-6" /> // Added icon
  },
  {
    title: "chemistry",
    description: "Chemistry studies the properties of substances and their transformations in an effort to understand the material world.",
    category: "Core Sciences",
    color: "#10b981", // emerald-500
    purpose: "mcqs",
    topicCount: 0,
    icon: <FlaskConical className="h-6 w-6" /> // Added icon
  },
  // ... Additional subjects would go here
];

// For backward compatibility
export const mockSubjects = subjects;
