
import { ReactNode } from "react";

export interface Topic {
  id: string;
  name: string;
  selected: boolean;
}

export interface CustomSubject {
  title: string;
  icon: ReactNode; // Now required, matching the Subject interface
  category: string;
  topics: Topic[];
  expanded: boolean;
  selected: boolean;
  color: string;
  topicCount: number;
}

export interface QuizSettings {
  timeLimit: number; // in minutes
  questionsCount: number;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  quizType: "practice" | "timed" | "challenge" | "adaptive";
}
