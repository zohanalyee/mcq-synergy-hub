
import { MCQItem } from "@/interfaces/content";
import { getContentByCategory, getContentBySubjectAndTopic } from "./baseContentService";

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

// Get quizzes
export const getQuizzes = () => {
  return getContentByCategory('quiz');
};

// Get quizzes by subject and optionally by topic
export const getQuizzesBySubject = (subject?: string, topic?: string) => {
  return getContentBySubjectAndTopic('quiz', subject, topic);
};

// Get quizzes by topic
export const getQuizzesByTopic = (topic: string) => {
  return getContentBySubjectAndTopic('quiz', undefined, topic);
};
