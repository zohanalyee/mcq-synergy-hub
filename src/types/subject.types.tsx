import { ReactNode } from "react";

// Subject type definition
export type SubjectPurpose = "reading" | "mcqs";

export interface Subject {
  id?: string;           // database UUID
  title: string;
  icon: ReactNode;
  description: string;
  topicCount: number;
  color: string;
  category: string;
  purpose: SubjectPurpose;
  levelId?: string;      // LMS level UUID
  levelName?: string;    // e.g., "Class 9"
  systemId?: string;     // LMS system UUID
  systemName?: string;   // e.g., "Sindh Board"
}
