
import { Microscope, Beaker, Stethoscope, Brain } from "lucide-react";
import { Subject } from "@/types/subject.types";

export const medicalSubjects: Subject[] = [
  {
    title: "Microbiology",
    icon: <Microscope className="h-6 w-6 text-emerald-500" />,
    description: "Study of microorganisms, bacteria, viruses, and their applications.",
    topicCount: 8,
    color: "#10b981",
    category: "Medical Sciences",
    purpose: "reading"
  },
  {
    title: "Biochemistry",
    icon: <Beaker className="h-6 w-6 text-purple-500" />,
    description: "Chemical processes and substances in living organisms.",
    topicCount: 9,
    color: "#8b5cf6",
    category: "Medical Sciences",
    purpose: "mcqs"
  },
  {
    title: "Oral Anatomy",
    icon: <Stethoscope className="h-6 w-6 text-red-400" />,
    description: "Structure and function of oral and dental tissues.",
    topicCount: 6,
    color: "#f87171",
    category: "Medical Sciences",
    purpose: "reading"
  },
  {
    title: "General Anatomy",
    icon: <Brain className="h-6 w-6 text-pink-500" />,
    description: "Human body structure, systems, and tissue organization.",
    topicCount: 10,
    color: "#ec4899",
    category: "Medical Sciences",
    purpose: "mcqs"
  },
  {
    title: "Oral Pathology and Medicine",
    icon: <Stethoscope className="h-6 w-6 text-rose-600" />,
    description: "Diseases of oral and maxillofacial regions.",
    topicCount: 7,
    color: "#e11d48",
    category: "Medical Sciences",
    purpose: "reading"
  },
  {
    title: "Oral Histology",
    icon: <Microscope className="h-6 w-6 text-indigo-500" />,
    description: "Microscopic structure and development of oral tissues.",
    topicCount: 5,
    color: "#6366f1",
    category: "Medical Sciences",
    purpose: "reading"
  },
  {
    title: "Pathology",
    icon: <Microscope className="h-6 w-6 text-amber-600" />,
    description: "Disease processes, causes, and effects on body systems.",
    topicCount: 9,
    color: "#d97706",
    category: "Medical Sciences",
    purpose: "mcqs"
  },
  {
    title: "Dental Materials",
    icon: <Beaker className="h-6 w-6 text-sky-500" />,
    description: "Materials used in dentistry and their properties.",
    topicCount: 6,
    color: "#0ea5e9",
    category: "Medical Sciences",
    purpose: "mcqs"
  },
  {
    title: "Pharmacology",
    icon: <Beaker className="h-6 w-6 text-green-600" />,
    description: "Drug actions, interactions, and therapeutic applications.",
    topicCount: 8,
    color: "#16a34a",
    category: "Medical Sciences",
    purpose: "reading"
  },
  {
    title: "Physiology",
    icon: <Stethoscope className="h-6 w-6 text-blue-500" />,
    description: "Functions and mechanisms of living systems and organs.",
    topicCount: 10,
    color: "#3b82f6",
    category: "Medical Sciences",
    purpose: "mcqs"
  }
];
