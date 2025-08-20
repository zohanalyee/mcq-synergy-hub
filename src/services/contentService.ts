
// This file serves as the main interface for content operations
// It now delegates to both supabaseContentService and enhancedContentService

import { ContentItem, ContentSubmission, ContentCategory } from "@/interfaces/content";
import { 
  getAllContent as getAllContentBase, 
  getContentByCategory as getContentByCategoryBase,
  getContentBySubjectAndTopic as getContentBySubjectAndTopicBase,
  updateContentStatus as updateContentStatusBase,
  deleteContent as deleteContentBase,
  getSubjectsAndTopics as getSubjectsAndTopicsBase,
  saveQuizAttempt,
  getUserQuizAttempts
} from "./supabaseContentService";
import { EnhancedContentService } from "./enhancedContentService";
import { UserRole } from "@/contexts/UserRoleContext";

// Use enhanced service for submission
export const submitContent = EnhancedContentService.submitContent;

// Re-export all other functions from supabaseContentService
export const getContentByCategory = getContentByCategoryBase;
export const getContentBySubjectAndTopic = getContentBySubjectAndTopicBase;
export const getAllContent = getAllContentBase;
export const updateContentStatus = updateContentStatusBase;
export const deleteContent = deleteContentBase;

// Use enhanced service for subjects and topics but fall back to Supabase services
export const getSubjectsAndTopics = async () => {
  try {
    return await EnhancedContentService.getSubjectsAndTopics();
  } catch (error) {
    console.error("Error fetching subjects and topics:", error);
    return { subjects: [], topics: {} };
  }
};

// Export quiz-related functions
export { saveQuizAttempt, getUserQuizAttempts };

// Utility functions
export const generateId = (): string => {
  return crypto.randomUUID();
};

export const convertFileToUrl = (file: File): string => {
  return URL.createObjectURL(file);
};
