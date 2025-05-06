
import { ReactNode } from "react";

// Subject type definition
export type SubjectPurpose = "reading" | "mcqs";

export interface Subject {
  title: string;
  icon: ReactNode;
  description: string;
  topicCount: number;
  color: string;
  category: string;
  purpose: SubjectPurpose;
}
