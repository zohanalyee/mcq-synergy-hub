
import { DollarSign, Users, ShoppingCart, ScrollText, FileCheck } from "lucide-react";
import { Subject } from "@/types/subject.types";

export const managementSubjects: Subject[] = [
  {
    title: "Finance",
    icon: <DollarSign className="h-6 w-6 text-green-500" />,
    description: "Financial markets, investments, and corporate finance.",
    topicCount: 8,
    color: "#22c55e",
    category: "Management Sciences",
    purpose: "mcqs"
  },
  {
    title: "Human Resource Management",
    icon: <Users className="h-6 w-6 text-blue-500" />,
    description: "Personnel management, organizational behavior, and employee relations.",
    topicCount: 7,
    color: "#3b82f6",
    category: "Management Sciences",
    purpose: "reading"
  },
  {
    title: "Marketing",
    icon: <ShoppingCart className="h-6 w-6 text-orange-500" />,
    description: "Marketing strategies, consumer behavior, and brand management.",
    topicCount: 6,
    color: "#f97316",
    category: "Management Sciences",
    purpose: "mcqs"
  },
  {
    title: "Accounting",
    icon: <ScrollText className="h-6 w-6 text-slate-600" />,
    description: "Financial accounting, cost accounting, and accounting standards.",
    topicCount: 9,
    color: "#64748b",
    category: "Management Sciences",
    purpose: "mcqs"
  },
  {
    title: "Auditing",
    icon: <FileCheck className="h-6 w-6 text-violet-500" />,
    description: "Audit procedures, standards, and financial reporting practices.",
    topicCount: 7,
    color: "#8b5cf6",
    category: "Management Sciences",
    purpose: "reading"
  }
];
