
import { Subject } from "@/data/subjectsData";

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
