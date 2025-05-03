
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { Subject } from "@/data/subjectsData";
import { JobTest, SyllabusItem } from "@/data/jobTestsData";
import { Topic, TopicsData } from "@/data/topicsData";

// The subjects, topics, and job tests are currently in separate files
// In a real application, these would be in a database
// For now, we'll simulate this with localStorage

// Subjects Management
export const getSubjects = (): Subject[] => {
  try {
    const savedSubjects = localStorage.getItem('subjects');
    if (savedSubjects) {
      return JSON.parse(savedSubjects);
    }
  } catch (error) {
    console.error("Error loading subjects:", error);
  }
  
  // If we can't load from localStorage, return an empty array
  // In a real app, we would return the default subjects from the data file
  return [];
};

export const saveSubjects = (subjects: Subject[]) => {
  try {
    localStorage.setItem('subjects', JSON.stringify(subjects));
    return true;
  } catch (error) {
    console.error("Error saving subjects:", error);
    return false;
  }
};

export const addSubject = (subject: Omit<Subject, "topicCount">) => {
  try {
    const subjects = getSubjects();
    const newSubject: Subject = {
      ...subject,
      topicCount: 0, // Will be updated when topics are added
    };
    
    const updatedSubjects = [...subjects, newSubject];
    saveSubjects(updatedSubjects);
    return newSubject;
  } catch (error) {
    console.error("Error adding subject:", error);
    return null;
  }
};

export const updateSubject = (subject: Subject) => {
  try {
    const subjects = getSubjects();
    const updatedSubjects = subjects.map(s => 
      s.title === subject.title ? subject : s
    );
    
    saveSubjects(updatedSubjects);
    return subject;
  } catch (error) {
    console.error("Error updating subject:", error);
    return null;
  }
};

export const removeSubject = (title: string) => {
  try {
    const subjects = getSubjects();
    const updatedSubjects = subjects.filter(s => s.title !== title);
    
    saveSubjects(updatedSubjects);
    return true;
  } catch (error) {
    console.error("Error removing subject:", error);
    return false;
  }
};

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

// Job Tests Management
export const getJobTests = (): JobTest[] => {
  try {
    const savedJobTests = localStorage.getItem('jobTests');
    if (savedJobTests) {
      return JSON.parse(savedJobTests);
    }
  } catch (error) {
    console.error("Error loading job tests:", error);
  }
  
  // If we can't load from localStorage, return an empty array
  return [];
};

export const saveJobTests = (jobTests: JobTest[]) => {
  try {
    localStorage.setItem('jobTests', JSON.stringify(jobTests));
    return true;
  } catch (error) {
    console.error("Error saving job tests:", error);
    return false;
  }
};

export const addJobTest = (jobTest: Omit<JobTest, "id">) => {
  try {
    const jobTests = getJobTests();
    
    // Generate an ID
    const newId = jobTests.length > 0 
      ? Math.max(...jobTests.map(t => t.id)) + 1 
      : 1;
    
    const newJobTest: JobTest = {
      ...jobTest,
      id: newId
    };
    
    const updatedJobTests = [...jobTests, newJobTest];
    saveJobTests(updatedJobTests);
    
    return newJobTest;
  } catch (error) {
    console.error("Error adding job test:", error);
    return null;
  }
};

export const updateJobTest = (jobTest: JobTest) => {
  try {
    const jobTests = getJobTests();
    const updatedJobTests = jobTests.map(t => 
      t.id === jobTest.id ? jobTest : t
    );
    
    saveJobTests(updatedJobTests);
    return jobTest;
  } catch (error) {
    console.error("Error updating job test:", error);
    return null;
  }
};

export const removeJobTest = (id: number) => {
  try {
    const jobTests = getJobTests();
    const updatedJobTests = jobTests.filter(t => t.id !== id);
    
    saveJobTests(updatedJobTests);
    return true;
  } catch (error) {
    console.error("Error removing job test:", error);
    return false;
  }
};

// Initialize localStorage with data from the data files if it doesn't exist
export const initializeAdminData = (
  initialSubjects: Subject[], 
  initialTopics: TopicsData,
  initialJobTests: JobTest[]
) => {
  if (!localStorage.getItem('subjects')) {
    saveSubjects(initialSubjects);
  }
  
  if (!localStorage.getItem('topics')) {
    saveTopics(initialTopics);
  }
  
  if (!localStorage.getItem('jobTests')) {
    saveJobTests(initialJobTests);
  }
};
