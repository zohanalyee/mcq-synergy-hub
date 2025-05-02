
import { ContentItem, ContentStatus, ContentSubmission } from "@/interfaces/content";
import { v4 as uuidv4 } from 'uuid';

// Mock storage - in a real app, this would be a database
let contentItems: ContentItem[] = [];

// Load initial data from localStorage if available
const initializeData = () => {
  try {
    const savedContent = localStorage.getItem('contentItems');
    if (savedContent) {
      contentItems = JSON.parse(savedContent);
    }
    
    // If no content exists, add some example items
    if (contentItems.length === 0) {
      contentItems = [
        {
          id: uuidv4(),
          title: "Sample Scholarship",
          description: "This is a sample scholarship description.",
          category: "scholarship",
          tags: ["education", "undergraduate"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "approved",
          createdBy: "system",
          scholarshipType: "undergraduate",
          institution: "Sample University",
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          id: uuidv4(),
          title: "Sample Job Posting",
          description: "This is a sample job posting description.",
          category: "job",
          tags: ["IT", "remote"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "approved",
          createdBy: "system",
          cadre: "grade-3",
          department: "Information Technology",
          governmentLevel: "federal",
          deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      ];
      saveToStorage();
    }
  } catch (error) {
    console.error("Error initializing content data:", error);
    contentItems = [];
  }
};

// Save current state to localStorage
const saveToStorage = () => {
  try {
    localStorage.setItem('contentItems', JSON.stringify(contentItems));
  } catch (error) {
    console.error("Error saving content to localStorage:", error);
  }
};

// Initialize data when module loads
initializeData();

export const getAllContent = () => {
  return [...contentItems];
};

export const getApprovedContent = () => {
  return contentItems.filter(item => item.status === 'approved');
};

export const getContentByCategory = (category: string) => {
  return contentItems.filter(item => 
    item.status === 'approved' && 
    item.category === category
  );
};

export const getPendingContent = () => {
  return contentItems.filter(item => item.status === 'pending');
};

export const submitContent = (submission: ContentSubmission, userId: string = 'anonymous'): ContentItem => {
  // In a real app, you'd upload the files to storage and get URLs back
  // For this demo, we'll just store the file names
  const imageUrl = submission.imageFile ? URL.createObjectURL(submission.imageFile) : undefined;
  const fileUrl = submission.documentFile ? URL.createObjectURL(submission.documentFile) : undefined;

  const newItem: ContentItem = {
    id: uuidv4(),
    ...submission,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'pending',
    createdBy: userId,
    imageUrl,
    fileUrl
  };

  contentItems.push(newItem);
  saveToStorage();
  return newItem;
};

export const updateContentStatus = (
  id: string, 
  status: ContentStatus, 
  updates: Partial<ContentItem> = {}
): ContentItem | null => {
  const index = contentItems.findIndex(item => item.id === id);
  if (index === -1) return null;

  contentItems[index] = {
    ...contentItems[index],
    ...updates,
    status,
    updatedAt: new Date().toISOString()
  };

  saveToStorage();
  return contentItems[index];
};

export const deleteContent = (id: string): boolean => {
  const initialLength = contentItems.length;
  contentItems = contentItems.filter(item => item.id !== id);
  saveToStorage();
  return contentItems.length !== initialLength;
};
