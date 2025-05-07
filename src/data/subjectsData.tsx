
import { Subject } from "@/types/subject.types";
import { coreSciencesSubjects } from "./subjects/coreSciencesSubjects";
import { socialSciencesSubjects } from "./subjects/socialSciencesSubjects";
import { agricultureSubjects } from "./subjects/agricultureSubjects";
import { managementSubjects } from "./subjects/managementSubjects";
import { engineeringSubjects } from "./subjects/engineeringSubjects";
import { medicalSubjects } from "./subjects/medicalSubjects";

// Combine all subjects
export const subjects: Subject[] = [
  ...coreSciencesSubjects,
  ...socialSciencesSubjects,
  ...agricultureSubjects,
  ...managementSubjects,
  ...engineeringSubjects,
  ...medicalSubjects
];

// For backward compatibility
export const mockSubjects = subjects;
