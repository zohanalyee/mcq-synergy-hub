
import { MCQItem } from "@/interfaces/content";
import { getContentByCategory, getContentBySubjectAndTopic } from "./baseContentService";

// Parse CSV data for MCQs
export const parseCSVForMCQs = (csvContent: string): MCQItem[] => {
  const rows = csvContent.split('\n');
  if (rows.length <= 1) {
    throw new Error("CSV file is empty or invalid");
  }
  
  // Remove the header row and process data rows
  const dataRows = rows.slice(1).filter(row => row.trim().length > 0);
  
  return dataRows.map(row => {
    const columns = row.split(',').map(col => col.trim());
    
    if (columns.length < 9) {
      throw new Error("CSV row has insufficient columns");
    }
    
    return {
      question: columns[0],
      optionA: columns[1],
      optionB: columns[2],
      optionC: columns[3],
      optionD: columns[4],
      correctOption: columns[5] as 'A' | 'B' | 'C' | 'D',
      subject: columns[6],
      topic: columns[7],
      difficulty: columns[8] as 'Easy' | 'Medium' | 'Hard',
      explanation: columns.length > 9 ? columns[9] : ''
    };
  });
};

// Get MCQs by subject and optionally by topic
export const getMCQsBySubject = (subject?: string, topic?: string) => {
  return getContentBySubjectAndTopic('mcq', subject, topic);
};

// Get all MCQs
export const getAllMCQs = () => {
  return getContentByCategory('mcq');
};
