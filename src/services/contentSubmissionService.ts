
import { ContentItem, ContentSubmission, ContentStatus, MCQItem } from "@/interfaces/content";
import { v4 as uuidv4 } from 'uuid';
import { addContentItem } from "./baseContentService";
import { parseCSVForMCQs } from "./mcqService";
import { parseCSVForQuizzes } from "./quizService";

export const submitContent = (submission: ContentSubmission, userId: string = 'anonymous'): ContentItem => {
  // In a real app, you'd upload the files to storage and get URLs back
  // For this demo, we'll just store the file names
  const imageUrl = submission.imageFile ? URL.createObjectURL(submission.imageFile) : undefined;
  const fileUrl = submission.documentFile ? URL.createObjectURL(submission.documentFile) : undefined;

  let questions: MCQItem[] = [];
  
  // Create new content item with visibility settings
  const newItem: ContentItem = {
    id: uuidv4(),
    ...submission,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'pending',
    createdBy: userId,
    imageUrl,
    fileUrl,
    questions,
    // Set default visibility if admin hasn't specified
    showInSubjects: submission.showInSubjects ?? true,
    showInSyllabus: submission.showInSyllabus ?? false,
    showInMockTests: submission.showInMockTests ?? false
  };

  // Process CSV file for MCQs or Quizzes if present
  if (submission.csvFile && (submission.category === 'mcq' || submission.category === 'quiz')) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvContent = event.target?.result as string;
      try {
        if (submission.category === 'mcq') {
          questions = parseCSVForMCQs(csvContent);
        } else if (submission.category === 'quiz') {
          questions = parseCSVForQuizzes(csvContent);
        }
        
        // Update the new item with questions
        newItem.questions = questions;
        
        // Add the content item with questions
        addContentItem(newItem);
      } catch (error) {
        console.error("Error parsing CSV:", error);
        
        // Add the content item even if CSV parsing failed
        addContentItem(newItem);
      }
    };
    reader.readAsText(submission.csvFile);
  } else {
    // Add the content item immediately if no CSV file to process
    addContentItem(newItem);
  }

  return newItem;
};
