
import { MCQItem } from "@/interfaces/content";
import { getContentByCategory, getContentBySubjectAndTopic } from "./baseContentService";
import { v4 as uuidv4 } from 'uuid';

// Quiz interface
export interface Quiz {
  id: string;
  title: string;
  description: string;
  subject: string;
  topic?: string;
  questions: MCQItem[];
  timeLimit: number;
}

// Parse CSV data for Quizzes
export const parseCSVForQuizzes = (csvContent: string): MCQItem[] => {
  const rows = csvContent.split('\n');
  if (rows.length <= 1) {
    throw new Error("CSV file is empty or invalid");
  }
  
  // Remove the header row and process data rows
  const dataRows = rows.slice(1).filter(row => row.trim().length > 0);
  
  return dataRows.map(row => {
    const columns = row.split(',').map(col => col.trim());
    
    if (columns.length < 10) {
      throw new Error("CSV row has insufficient columns");
    }
    
    return {
      question: columns[1],
      optionA: columns[2],
      optionB: columns[3],
      optionC: columns[4],
      optionD: columns[5],
      correctOption: columns[6] as 'A' | 'B' | 'C' | 'D',
      subject: columns[7],
      topic: columns[8],
      difficulty: 'Medium', // Default difficulty
      explanation: columns.length > 10 ? columns[11] : ''
    };
  });
};

// Local storage key for quizzes
const QUIZZES_STORAGE_KEY = 'mcqs_point_quizzes';

// Get all quizzes
export const getQuizzes = (): Quiz[] => {
  const storedQuizzes = localStorage.getItem(QUIZZES_STORAGE_KEY);
  if (storedQuizzes) {
    try {
      return JSON.parse(storedQuizzes);
    } catch (error) {
      console.error('Error parsing quizzes from localStorage:', error);
      return [];
    }
  }
  return [];
};

// Add a new quiz
export const addQuiz = (quiz: Omit<Quiz, 'id'>): Quiz => {
  const newQuiz: Quiz = {
    ...quiz,
    id: uuidv4(),
  };
  
  const quizzes = getQuizzes();
  quizzes.push(newQuiz);
  
  localStorage.setItem(QUIZZES_STORAGE_KEY, JSON.stringify(quizzes));
  return newQuiz;
};

// Remove a quiz
export const removeQuiz = (id: string): boolean => {
  const quizzes = getQuizzes();
  const filteredQuizzes = quizzes.filter(quiz => quiz.id !== id);
  
  if (filteredQuizzes.length < quizzes.length) {
    localStorage.setItem(QUIZZES_STORAGE_KEY, JSON.stringify(filteredQuizzes));
    return true;
  }
  return false;
};

// Get quizzes by subject and optionally by topic
export const getQuizzesBySubject = (subject?: string, topic?: string) => {
  const quizzes = getQuizzes();
  
  if (!subject) {
    return quizzes;
  }
  
  return quizzes.filter(quiz => {
    if (topic) {
      return quiz.subject === subject && quiz.topic === topic;
    }
    return quiz.subject === subject;
  });
};

// Get quizzes by topic
export const getQuizzesByTopic = (topic: string) => {
  const quizzes = getQuizzes();
  return quizzes.filter(quiz => quiz.topic === topic);
};
