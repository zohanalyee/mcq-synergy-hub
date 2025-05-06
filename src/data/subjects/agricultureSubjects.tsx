
import { Beaker } from "lucide-react";
import { Subject } from "@/types/subject.types";

export const agricultureSubjects: Subject[] = [
  {
    title: "Agriculture",
    icon: <Beaker className="h-6 w-6 text-green-600" />,
    description: "Crop science, soil management, and agricultural technologies.",
    topicCount: 8,
    color: "#16a34a",
    category: "Agriculture & Environment",
    purpose: "mcqs"
  },
  {
    title: "Forestry",
    icon: <Beaker className="h-6 w-6 text-emerald-700" />,
    description: "Forest management, conservation, and ecosystem principles.",
    topicCount: 6,
    color: "#047857",
    category: "Agriculture & Environment",
    purpose: "reading"
  }
];
