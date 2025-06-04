
// This file serves as the main interface for content operations
// It delegates to baseContentService for actual implementation

import { ContentItem, ContentSubmission, ContentCategory } from "@/interfaces/content";
import { 
  getAllContent as getAllContentBase, 
  addContentItem, 
  getContentByCategory as getContentByCategoryBase,
  updateContentStatus as updateContentStatusBase,
  deleteContent as deleteContentBase,
  getSubjectsAndTopics
} from "./baseContentService";
import { v4 as uuidv4 } from 'uuid';

// Helper functions that were missing
export const generateId = (): string => uuidv4();

export const convertFileToUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

// Submit new content
export const submitContent = (submission: ContentSubmission, userRole: 'admin' | 'user'): ContentItem => {
  console.log("Submitting content:", submission);
  
  const now = new Date().toISOString();
  
  const contentItem: ContentItem = {
    id: generateId(),
    title: submission.title,
    description: submission.description,
    category: submission.category,
    tags: submission.tags,
    createdAt: now,
    updatedAt: now,
    status: userRole === 'admin' ? 'approved' : 'pending', // Auto-approve for admin
    createdBy: 'current-user', // In a real app, this would be the actual user ID
    
    // Handle file uploads
    imageUrl: submission.imageFile ? convertFileToUrl(submission.imageFile) : undefined,
    fileUrl: submission.documentFile ? convertFileToUrl(submission.documentFile) : undefined,
    
    // Category-specific fields
    deadline: submission.deadline,
    department: submission.department,
    governmentLevel: submission.governmentLevel,
    cadre: submission.cadre,
    scholarshipType: submission.scholarshipType,
    institution: submission.institution,
    examType: submission.examType,
    examYear: submission.examYear,
    
    // SEO fields
    metaTitle: submission.metaTitle,
    metaDescription: submission.metaDescription,
    metaKeywords: submission.metaKeywords,
    
    // CV specific fields
    candidateName: submission.candidateName,
    experience: submission.experience,
    skills: submission.skills,
    education: submission.education,
    contactInfo: submission.contactInfo,
    
    // Visibility settings
    showInSubjects: submission.showInSubjects,
    showInSyllabus: submission.showInSyllabus,
    showInMockTests: submission.showInMockTests,
  };
  
  return addContentItem(contentItem);
};

// Get content by category (only approved content)
export const getContentByCategory = (category: ContentCategory): ContentItem[] => {
  console.log("Getting content for category:", category);
  const content = getContentByCategoryBase(category);
  console.log("Found content items:", content.length);
  return content;
};

// Re-export functions from base service with proper names
export const getAllContent = (): ContentItem[] => {
  return getAllContentBase();
};

export const updateContentStatus = updateContentStatusBase;

export const deleteContent = deleteContentBase;

// Export the getSubjectsAndTopics function
export { getSubjectsAndTopics } from "./baseContentService";
