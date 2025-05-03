
import { Topic, TopicsData } from "@/data/topicsData";
import { getSubjects, updateSubject } from "./subjectService";

// Topics Management
export const getTopics = (): TopicsData => {
  try {
    const savedTopics = localStorage.getItem('topics');
    if (savedTopics) {
      return JSON.parse(savedTopics);
    }
  } catch (error) {
    console.error("Error loading topics:", error);
  }
  
  // If we can't load from localStorage, return an empty object
  return {};
};

export const saveTopics = (topics: TopicsData) => {
  try {
    localStorage.setItem('topics', JSON.stringify(topics));
    return true;
  } catch (error) {
    console.error("Error saving topics:", error);
    return false;
  }
};

export const addTopic = (subject: string, topic: Topic) => {
  try {
    const topics = getTopics();
    const subjectTopics = topics[subject] || [];
    
    topics[subject] = [...subjectTopics, topic];
    saveTopics(topics);
    
    // Update the topic count in the subject
    const subjects = getSubjects();
    const subjectToUpdate = subjects.find(s => s.title === subject);
    
    if (subjectToUpdate) {
      subjectToUpdate.topicCount += 1;
      updateSubject(subjectToUpdate);
    }
    
    return topic;
  } catch (error) {
    console.error("Error adding topic:", error);
    return null;
  }
};

export const removeTopic = (subject: string, topicTitle: string) => {
  try {
    const topics = getTopics();
    const subjectTopics = topics[subject] || [];
    
    if (subjectTopics.length === 0) {
      return false;
    }
    
    topics[subject] = subjectTopics.filter(t => t.title !== topicTitle);
    saveTopics(topics);
    
    // Update the topic count in the subject
    const subjects = getSubjects();
    const subjectToUpdate = subjects.find(s => s.title === subject);
    
    if (subjectToUpdate) {
      subjectToUpdate.topicCount = Math.max(0, subjectToUpdate.topicCount - 1);
      updateSubject(subjectToUpdate);
    }
    
    return true;
  } catch (error) {
    console.error("Error removing topic:", error);
    return false;
  }
};
