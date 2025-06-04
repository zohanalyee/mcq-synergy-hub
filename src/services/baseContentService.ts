
import { ContentItem, ContentStatus } from "@/interfaces/content";
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for demo purposes
let contentStore: ContentItem[] = [];

export const getAllContent = (): ContentItem[] => {
  return [...contentStore];
};

export const getContentByCategory = (category: string): ContentItem[] => {
  return contentStore.filter(item => 
    item.category === category && item.status === 'approved'
  );
};

export const addContentItem = (item: ContentItem): ContentItem => {
  contentStore.push(item);
  console.log("Added content item:", item.title);
  return item;
};

export const updateContentStatus = (
  id: string, 
  status: ContentStatus, 
  updates?: Partial<ContentItem>
): ContentItem | null => {
  const index = contentStore.findIndex(item => item.id === id);
  
  if (index === -1) {
    console.error("Content item not found:", id);
    return null;
  }

  // Apply status and any additional updates
  const updatedItem = {
    ...contentStore[index],
    status,
    updatedAt: new Date().toISOString(),
    ...updates
  };

  contentStore[index] = updatedItem;
  console.log("Updated content item:", updatedItem.title, "Status:", status);
  
  return updatedItem;
};

export const deleteContent = (id: string): boolean => {
  const index = contentStore.findIndex(item => item.id === id);
  
  if (index === -1) {
    console.error("Content item not found for deletion:", id);
    return false;
  }

  const deletedItem = contentStore.splice(index, 1)[0];
  console.log("Deleted content item:", deletedItem.title);
  return true;
};

export const getSubjectsAndTopics = () => {
  const subjects = new Set<string>();
  const topicsBySubject: Record<string, Set<string>> = {};

  contentStore.forEach(item => {
    if (item.subject) {
      subjects.add(item.subject);
      
      if (item.topic) {
        if (!topicsBySubject[item.subject]) {
          topicsBySubject[item.subject] = new Set();
        }
        topicsBySubject[item.subject].add(item.topic);
      }
    }
  });

  return {
    subjects: Array.from(subjects),
    topics: Object.fromEntries(
      Object.entries(topicsBySubject).map(([subject, topicsSet]) => [
        subject,
        Array.from(topicsSet)
      ])
    )
  };
};

// Initialize with sample data if empty
export const initializeWithSampleData = (sampleData: ContentItem[]) => {
  if (contentStore.length === 0) {
    contentStore = [...sampleData];
    console.log("Initialized content store with sample data:", contentStore.length, "items");
  }
};
