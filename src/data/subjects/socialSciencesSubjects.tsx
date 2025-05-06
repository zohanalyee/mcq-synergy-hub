
import { Brain, BarChart, Users, Landmark, Book, Scale, Globe, Dumbbell } from "lucide-react";
import { Subject } from "@/types/subject.types";

export const socialSciencesSubjects: Subject[] = [
  {
    title: "Psychology",
    icon: <Brain className="h-6 w-6 text-pink-500" />,
    description: "Behavioral studies, cognitive processes, and psychological theories.",
    topicCount: 8,
    color: "#ec4899",
    category: "Social Sciences",
    purpose: "reading"
  },
  {
    title: "Economics",
    icon: <BarChart className="h-6 w-6 text-blue-700" />,
    description: "Microeconomics, macroeconomics, and international economics concepts.",
    topicCount: 7,
    color: "#1d4ed8",
    category: "Social Sciences",
    purpose: "mcqs"
  },
  {
    title: "Sociology",
    icon: <Users className="h-6 w-6 text-cyan-600" />,
    description: "Social interactions, institutions, and cultural dynamics.",
    topicCount: 6,
    color: "#0891b2",
    category: "Social Sciences",
    purpose: "reading"
  },
  {
    title: "Political Science",
    icon: <Landmark className="h-6 w-6 text-yellow-600" />,
    description: "Political theories, systems of government, and international relations.",
    topicCount: 7,
    color: "#ca8a04",
    category: "Social Sciences",
    purpose: "mcqs"
  },
  {
    title: "Statistics",
    icon: <BarChart className="h-6 w-6 text-indigo-600" />,
    description: "Data analysis, probability, and statistical methods.",
    topicCount: 8,
    color: "#4f46e5",
    category: "Social Sciences",
    purpose: "mcqs"
  },
  {
    title: "English Literature",
    icon: <Book className="h-6 w-6 text-amber-600" />,
    description: "Literary analysis, periods, and critical reading of texts.",
    topicCount: 6,
    color: "#d97706",
    category: "Social Sciences",
    purpose: "reading"
  },
  {
    title: "Judiciary and Law",
    icon: <Scale className="h-6 w-6 text-gray-600" />,
    description: "Legal principles, case studies, and judicial procedures.",
    topicCount: 9,
    color: "#4b5563",
    category: "Social Sciences",
    purpose: "reading"
  },
  {
    title: "International Relations",
    icon: <Globe className="h-6 w-6 text-blue-600" />,
    description: "Global politics, diplomacy, and international organizations.",
    topicCount: 7,
    color: "#2563eb",
    category: "Social Sciences",
    purpose: "mcqs"
  },
  {
    title: "Physical Education",
    icon: <Dumbbell className="h-6 w-6 text-rose-600" />,
    description: "Sports science, fitness, and physical health concepts.",
    topicCount: 5,
    color: "#e11d48",
    category: "Social Sciences",
    purpose: "reading"
  }
];
