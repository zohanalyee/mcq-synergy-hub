
import { ContentItem, ContentStatus } from "@/interfaces/content";
import { CONTENT_ITEMS_KEY } from "@/services/sampleContentData"; 

// Get all content from localStorage or initialize if empty
export const getAllContent = (): ContentItem[] => {
  try {
    const storedContent = localStorage.getItem(CONTENT_ITEMS_KEY);
    return storedContent ? JSON.parse(storedContent) : [];
  } catch (error) {
    console.error("Error retrieving content:", error);
    return [];
  }
};

// Add new content item
export const addContentItem = (item: ContentItem): ContentItem => {
  try {
    const currentContent = getAllContent();
    const newContent = [...currentContent, item];
    localStorage.setItem(CONTENT_ITEMS_KEY, JSON.stringify(newContent));
    return item;
  } catch (error) {
    console.error("Error adding content:", error);
    throw error;
  }
};

// Get content by status
export const getPendingContent = (): ContentItem[] => {
  return getAllContent().filter(item => item.status === "pending");
};

export const getApprovedContent = (): ContentItem[] => {
  return getAllContent().filter(item => item.status === "approved");
};

// Get content by category
export const getContentByCategory = (category: string): ContentItem[] => {
  return getAllContent().filter(item => 
    item.status === "approved" && item.category === category
  );
};

// Update content status
export const updateContentStatus = (
  id: string, 
  status: ContentStatus, 
  updates?: Partial<ContentItem>
): ContentItem | null => {
  try {
    const allContent = getAllContent();
    const index = allContent.findIndex(item => item.id === id);
    
    if (index === -1) {
      console.error(`Content with ID ${id} not found`);
      return null;
    }
    
    // Apply updates with visibility settings
    const updatedItem = {
      ...allContent[index],
      status,
      updatedAt: new Date().toISOString(),
      ...(updates || {})
    };
    
    allContent[index] = updatedItem;
    localStorage.setItem(CONTENT_ITEMS_KEY, JSON.stringify(allContent));
    
    return updatedItem;
  } catch (error) {
    console.error(`Error updating content status to ${status}:`, error);
    throw error;
  }
};

// Delete content
export const deleteContent = (id: string): boolean => {
  try {
    const allContent = getAllContent();
    const filteredContent = allContent.filter(item => item.id !== id);
    
    if (filteredContent.length === allContent.length) {
      console.error(`Content with ID ${id} not found`);
      return false;
    }
    
    localStorage.setItem(CONTENT_ITEMS_KEY, JSON.stringify(filteredContent));
    return true;
  } catch (error) {
    console.error("Error deleting content:", error);
    throw error;
  }
};

// Get subjects and topics from content
export const getSubjectsAndTopics = () => {
  const approvedContent = getApprovedContent();
  const subjects = Array.from(new Set(
    approvedContent
      .filter(item => item.subject)
      .map(item => item.subject as string)
  ));
  
  // Get topics grouped by subject
  const topics = subjects.reduce((acc, subject) => {
    const subjectTopics = Array.from(new Set(
      approvedContent
        .filter(item => item.subject === subject && item.topic)
        .map(item => item.topic as string)
    ));
    
    acc[subject] = subjectTopics;
    return acc;
  }, {} as Record<string, string[]>);
  
  return { subjects, topics };
};

// Get content by subject and topic
export const getContentBySubjectAndTopic = (subject: string, topic?: string) => {
  const approvedContent = getApprovedContent();
  
  return approvedContent.filter(item => {
    const matchesSubject = item.subject === subject;
    const matchesTopic = !topic || item.topic === topic;
    
    // Respect visibility settings
    const isVisibleInSubjects = item.showInSubjects !== false;
    
    return matchesSubject && matchesTopic && isVisibleInSubjects;
  });
};

// New function to get content for syllabus builder
export const getContentForSyllabus = (subject: string, topic?: string) => {
  const approvedContent = getApprovedContent();
  
  return approvedContent.filter(item => {
    const matchesSubject = item.subject === subject;
    const matchesTopic = !topic || item.topic === topic;
    
    // Only show items that are marked for syllabus
    const isVisibleInSyllabus = item.showInSyllabus === true;
    
    return matchesSubject && matchesTopic && isVisibleInSyllabus;
  });
};

// New function to get content for mock tests
export const getContentForMockTests = (subject: string, topic?: string) => {
  const approvedContent = getApprovedContent();
  
  return approvedContent.filter(item => {
    const matchesSubject = item.subject === subject;
    const matchesTopic = !topic || item.topic === topic;
    
    // Only show items that are marked for mock tests
    const isVisibleInMockTests = item.showInMockTests === true;
    
    return matchesSubject && matchesTopic && isVisibleInMockTests;
  });
};
