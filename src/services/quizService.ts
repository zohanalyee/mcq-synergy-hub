
import { MCQItem } from "@/interfaces/content";

export interface Quiz {
  id: string;
  title: string;
  description: string;
  subject: string;
  topic: string;
  questions: MCQItem[];
  timeLimit: number;
}

// Quizzes Management
export const getQuizzes = (): Quiz[] => {
  try {
    const savedQuizzes = localStorage.getItem('quizzes');
    if (savedQuizzes) {
      return JSON.parse(savedQuizzes);
    }
  } catch (error) {
    console.error("Error loading quizzes:", error);
  }
  
  // If we can't load from localStorage, return an empty array
  return [];
};

export const saveQuizzes = (quizzes: Quiz[]) => {
  try {
    localStorage.setItem('quizzes', JSON.stringify(quizzes));
    return true;
  } catch (error) {
    console.error("Error saving quizzes:", error);
    return false;
  }
};

export const addQuiz = (quiz: Omit<Quiz, "id">) => {
  try {
    const quizzes = getQuizzes();
    
    const newQuiz: Quiz = {
      ...quiz,
      id: Date.now().toString()
    };
    
    const updatedQuizzes = [...quizzes, newQuiz];
    saveQuizzes(updatedQuizzes);
    
    return newQuiz;
  } catch (error) {
    console.error("Error adding quiz:", error);
    return null;
  }
};

export const updateQuiz = (quiz: Quiz) => {
  try {
    const quizzes = getQuizzes();
    const updatedQuizzes = quizzes.map(q => 
      q.id === quiz.id ? quiz : q
    );
    
    saveQuizzes(updatedQuizzes);
    return quiz;
  } catch (error) {
    console.error("Error updating quiz:", error);
    return null;
  }
};

export const removeQuiz = (id: string) => {
  try {
    const quizzes = getQuizzes();
    const updatedQuizzes = quizzes.filter(q => q.id !== id);
    
    saveQuizzes(updatedQuizzes);
    return true;
  } catch (error) {
    console.error("Error removing quiz:", error);
    return false;
  }
};

export const getQuizzesBySubject = (subject: string = ""): Quiz[] => {
  const quizzes = getQuizzes();
  if (!subject) {
    // Group quizzes by subject if no specific subject is provided
    // This creates a simple structure where each subject has its quizzes
    const groupedBySubject: Quiz[] = [...quizzes];
    return groupedBySubject;
  }
  return quizzes.filter(quiz => quiz.subject === subject);
};

export const getQuizzesByTopic = (subject: string, topic: string): Quiz[] => {
  const quizzes = getQuizzes();
  return quizzes.filter(quiz => quiz.subject === subject && quiz.topic === topic);
};
