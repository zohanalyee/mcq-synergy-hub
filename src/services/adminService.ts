
import { Subject } from "@/types/subject.types";
import { subjects as defaultSubjects } from "@/data/subjectsData";
import { Plus } from "lucide-react";
import React from 'react';

// Clone function with special handling for React elements
const cloneDeep = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Don't try to clone React elements
  if (React.isValidElement(obj)) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => cloneDeep(item));
  }

  const cloned: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = cloneDeep(obj[key]);
    }
  }
  return cloned;
};

// Helper function to create icon without JSX
const createIconElement = (color: string) => {
  // Create the element programmatically instead of using JSX
  return React.createElement(Plus, {
    className: "h-6 w-6",
    style: { color: color || '#3b82f6' }
  });
};

// Get subjects from localStorage or return default subjects
export const getSubjects = (): Subject[] => {
  try {
    const savedSubjects = localStorage.getItem('subjects');
    if (savedSubjects) {
      // Parse saved subjects and recreate any React elements
      const parsed = JSON.parse(savedSubjects, (key, value) => {
        // Skip objects that look like serialized React elements
        if (
          value && 
          typeof value === 'object' && 
          value.iconType && 
          value.iconProps
        ) {
          // Return null instead of trying to reconstruct the icon
          return null;
        }
        return value;
      });

      if (Array.isArray(parsed) && parsed.length > 0) {
        // Add default icons for any that were serialized
        return parsed.map(subject => ({
          ...subject,
          // Create icon programmatically instead of using JSX
          icon: subject.icon || createIconElement(subject.color)
        }));
      }
    }
  } catch (error) {
    console.error("Error loading subjects:", error);
  }
  
  // Return default subjects if we can't load from localStorage
  return cloneDeep(defaultSubjects);
};

// Add a subject
export const addSubject = (subject: any): boolean => {
  try {
    const subjects = getSubjects();
    
    // Check if a subject with the same title already exists
    const exists = subjects.some(s => s.title === subject.title);
    if (exists) {
      console.error("Subject with this title already exists");
      return false;
    }
    
    // Create a new subject with the provided data
    const newSubject: Subject = {
      ...subject,
      topicCount: 0, // New subjects start with 0 topics
    };
    
    const updatedSubjects = [...subjects, newSubject];
    saveSubjects(updatedSubjects);
    
    return true;
  } catch (error) {
    console.error("Error adding subject:", error);
    return false;
  }
};

// Remove a subject
export const removeSubject = (title: string): boolean => {
  try {
    const subjects = getSubjects();
    const updatedSubjects = subjects.filter(subject => subject.title !== title);
    
    if (subjects.length === updatedSubjects.length) {
      console.error("Subject not found");
      return false;
    }
    
    saveSubjects(updatedSubjects);
    return true;
  } catch (error) {
    console.error("Error removing subject:", error);
    return false;
  }
};

// Save subjects to localStorage
const saveSubjects = (subjects: Subject[]): boolean => {
  try {
    // Before saving, we need to remove React elements which can't be serialized
    const serializableSubjects = subjects.map(subject => {
      // Create a new object without the icon property
      const { icon, ...rest } = subject;
      return {
        ...rest,
        // Add a placeholder instead
        iconType: icon ? 'reactElement' : null,
      };
    });
    
    localStorage.setItem('subjects', JSON.stringify(serializableSubjects));
    return true;
  } catch (error) {
    console.error("Error saving subjects:", error);
    return false;
  }
};
