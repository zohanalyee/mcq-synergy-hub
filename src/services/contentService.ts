
// This file serves as the main interface for content operations
// It now delegates to supabaseContentService for actual implementation

import { ContentItem, ContentSubmission, ContentCategory } from "@/interfaces/content";
import { 
  getAllContent as getAllContentBase, 
  submitContent as submitContentBase,
  getContentByCategory as getContentByCategoryBase,
  getContentBySubjectAndTopic as getContentBySubjectAndTopicBase,
  updateContentStatus as updateContentStatusBase,
  deleteContent as deleteContentBase,
  getSubjectsAndTopics as getSubjectsAndTopicsBase,
  saveQuizAttempt,
  getUserQuizAttempts
} from "./supabaseContentService";
import { UserRole } from "@/contexts/UserRoleContext";

// Re-export all functions from supabaseContentService
export const submitContent = submitContentBase;
export const getContentByCategory = getContentByCategoryBase;
export const getContentBySubjectAndTopic = getContentBySubjectAndTopicBase;
export const getAllContent = getAllContentBase;
export const updateContentStatus = updateContentStatusBase;
export const deleteContent = deleteContentBase;
export const getSubjectsAndTopics = getSubjectsAndTopicsBase;

// Export quiz-related functions
export { saveQuizAttempt, getUserQuizAttempts };

// Utility functions
export const generateId = (): string => {
  return crypto.randomUUID();
};

export const convertFileToUrl = (file: File): string => {
  return URL.createObjectURL(file);
};
