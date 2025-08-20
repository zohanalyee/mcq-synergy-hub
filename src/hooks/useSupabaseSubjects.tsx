import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { Subject, getSubjects, addSubject, updateSubject, removeSubject } from "@/services/supabaseSubjectService";

export function useSupabaseSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load subjects on mount
  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSubjects();
      setSubjects(data);
    } catch (err) {
      console.error("Error loading subjects:", err);
      setError("Failed to load subjects");
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = async (subjectData: Omit<Subject, 'id' | 'created_at' | 'topicCount'>) => {
    try {
      const newSubject = await addSubject(subjectData);
      if (newSubject) {
        setSubjects(prev => [...prev, newSubject]);
        toast.success(`Subject "${subjectData.name}" added successfully`);
        return newSubject;
      } else {
        toast.error("Failed to add subject");
        return null;
      }
    } catch (error) {
      console.error("Error adding subject:", error);
      toast.error("Failed to add subject");
      return null;
    }
  };

  const handleUpdateSubject = async (id: string, updates: Partial<Subject>) => {
    try {
      const updatedSubject = await updateSubject(id, updates);
      if (updatedSubject) {
        setSubjects(prev => prev.map(s => s.id === id ? updatedSubject : s));
        toast.success(`Subject "${updates.name || 'updated'}" updated successfully`);
        return updatedSubject;
      } else {
        toast.error("Failed to update subject");
        return null;
      }
    } catch (error) {
      console.error("Error updating subject:", error);
      toast.error("Failed to update subject");
      return null;
    }
  };

  const handleRemoveSubject = async (id: string) => {
    try {
      const success = await removeSubject(id);
      if (success) {
        setSubjects(prev => prev.filter(s => s.id !== id));
        toast.success("Subject removed successfully");
        return true;
      } else {
        toast.error("Failed to remove subject");
        return false;
      }
    } catch (error) {
      console.error("Error removing subject:", error);
      toast.error("Failed to remove subject");
      return false;
    }
  };

  return {
    subjects,
    loading,
    error,
    loadSubjects,
    handleAddSubject,
    handleUpdateSubject,
    handleRemoveSubject
  };
}