
import { ContentItem, ContentStatus } from "@/interfaces/content";
import { v4 as uuidv4 } from 'uuid';

// Shared content storage
let contentItems: ContentItem[] = [];

// Load initial data from localStorage if available
export const initializeContentData = () => {
  try {
    const savedContent = localStorage.getItem('contentItems');
    if (savedContent) {
      contentItems = JSON.parse(savedContent);
    }
    
    // If no content exists, add some example items from sample service
    if (contentItems.length === 0) {
      const sampleContent = require('./sampleContentData').getSampleContent();
      contentItems = sampleContent;
      saveToStorage();
    }
  } catch (error) {
    console.error("Error initializing content data:", error);
    contentItems = [];
  }
};

// Save current state to localStorage
export const saveToStorage = () => {
  try {
    localStorage.setItem('contentItems', JSON.stringify(contentItems));
  } catch (error) {
    console.error("Error saving content to localStorage:", error);
  }
};

// Initialize data when module loads
initializeContentData();

// Generic content operations
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

// Add new content item
export const addContentItem = (item: ContentItem): void => {
  contentItems.push(item);
  saveToStorage();
};

// Export content items for other services to use
export const getContentItems = (): ContentItem[] => contentItems;

// Get content by subject and topic
export const getContentBySubjectAndTopic = (category: string, subject?: string, topic?: string) => {
  return contentItems.filter(item => {
    const categoryMatch = item.status === 'approved' && item.category === category;
    const subjectMatch = !subject || item.subject === subject;
    const topicMatch = !topic || item.topic === topic;
    return categoryMatch && subjectMatch && topicMatch;
  });
};

// Get all subjects and topics from content items
export const getSubjectsAndTopics = () => {
  const subjects = new Set<string>();
  const topicsBySubject: Record<string, Set<string>> = {};
  
  contentItems
    .filter(item => item.status === 'approved' && (item.category === 'mcq' || item.category === 'quiz'))
    .forEach(item => {
      if (item.subject) {
        subjects.add(item.subject);
        if (!topicsBySubject[item.subject]) {
          topicsBySubject[item.subject] = new Set<string>();
        }
        if (item.topic) {
          topicsBySubject[item.subject].add(item.topic);
        }
      }
    });
  
  return {
    subjects: Array.from(subjects),
    topicsBySubject: Object.fromEntries(
      Object.entries(topicsBySubject).map(([subject, topics]) => [subject, Array.from(topics)])
    )
  };
};
