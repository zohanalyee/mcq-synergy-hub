
import { useState, useEffect } from 'react';
import { Subject } from "@/types/subject.types";
import { getSubjects, addSubject, removeSubject } from "@/services/adminService";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import React from 'react';

export interface SubjectFormData {
  title: string;
  description: string;
  category: string;
  purpose: 'reading' | 'mcqs';
  color: string;
}

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    setSubjects(getSubjects());
  }, []);

  const handleAddSubject = (data: SubjectFormData) => {
    if (!data.title || !data.description) {
      toast.error("Please fill out all required fields");
      return false;
    }

    const newSubject = {
      ...data,
      icon: React.createElement(Plus, {
        className: "h-6 w-6",
        style: { color: data.color }
      }),
    };

    const added = addSubject(newSubject);
    
    if (added) {
      setSubjects(getSubjects());
      toast.success(`Subject "${data.title}" added successfully`);
      return true;
    } else {
      toast.error("Failed to add subject");
      return false;
    }
  };

  const handleRemoveSubject = (title: string) => {
    if (window.confirm(`Are you sure you want to delete the subject "${title}"?`)) {
      const removed = removeSubject(title);
      
      if (removed) {
        setSubjects(getSubjects());
        toast.success(`Subject "${title}" removed successfully`);
        return true;
      } else {
        toast.error("Failed to remove subject");
        return false;
      }
    }
    return false;
  };

  const categoriesList = [
    "Core Sciences",
    "Social Sciences",
    "Agriculture & Environment",
    "Management Sciences", 
    "Engineering",
    "Medical Sciences",
  ];

  return { subjects, handleAddSubject, handleRemoveSubject, categoriesList };
}
