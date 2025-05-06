
import { Zap, Building, Wrench, Beaker, Cpu } from "lucide-react";
import { Subject } from "@/types/subject.types";

export const engineeringSubjects: Subject[] = [
  {
    title: "Electrical Engineering",
    icon: <Zap className="h-6 w-6 text-yellow-500" />,
    description: "Circuits, electronics, power systems, and signal processing.",
    topicCount: 10,
    color: "#eab308",
    category: "Engineering",
    purpose: "mcqs"
  },
  {
    title: "Civil Engineering",
    icon: <Building className="h-6 w-6 text-slate-500" />,
    description: "Structural analysis, construction, and infrastructure design.",
    topicCount: 9,
    color: "#64748b",
    category: "Engineering",
    purpose: "mcqs"
  },
  {
    title: "Mechanical Engineering",
    icon: <Wrench className="h-6 w-6 text-zinc-600" />,
    description: "Thermodynamics, mechanics, and machine design principles.",
    topicCount: 8,
    color: "#52525b",
    category: "Engineering",
    purpose: "mcqs"
  },
  {
    title: "Chemical Engineering",
    icon: <Beaker className="h-6 w-6 text-red-500" />,
    description: "Chemical processes, reactor design, and thermodynamics.",
    topicCount: 7,
    color: "#ef4444",
    category: "Engineering",
    purpose: "reading"
  },
  {
    title: "Software Engineering",
    icon: <Cpu className="h-6 w-6 text-teal-500" />,
    description: "Software development lifecycle, design patterns, and testing methodologies.",
    topicCount: 8,
    color: "#14b8a6",
    category: "Engineering",
    purpose: "mcqs"
  }
];
