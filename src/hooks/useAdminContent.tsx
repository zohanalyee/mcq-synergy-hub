import { useState, useEffect, useRef, useCallback } from "react";
import { ContentItem, ContentStatus } from "@/interfaces/content";
import { updateContentStatus, deleteContent } from "@/services/contentService";
import { getAdminContentWindow, getAdminContentCounts } from "@/services/supabaseContentService";
import { toast } from "sonner";
import { EnhancedContentService } from "@/services/enhancedContentService";

const STATUS_TABS = ["pending", "approved", "rejected", "question_bank", "flagged_duplicate"];

// Tabs that don't render the content table at all (managed by their own components)
const NON_CONTENT_TABS = [
  'submit-content', 'subjects', 'topics', 'job-tests', 'mock-test-analytics', 'quizzes',
  'question-bank', 'analytics', 'data-migration', 'review-duplicates', 'bulk-upload',
  'dashboard', 'lms-structure', 'jobs', 'scholarships', 'inventory', 'documents',
  'messages', 'feedback-analytics', 'study-sounds', 'empty-topics', 'content-health',
  'lifecycle', 'add-content', 'opportunity-review', 'announcements'
];

const emptyStats = {
  pendingCount: 0,
  scholarshipCount: 0,
  mcqCount: 0,
  quizCount: 0,
  totalCount: 0,
};

export const useAdminContent = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [statistics, setStatistics] = useState(emptyStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("submit-content");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadContent = useCallback(async () => {
    // Skip fetching rows entirely for tabs that manage their own data
    if (NON_CONTENT_TABS.includes(activeTab)) {
      setContent([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const filter =
        activeTab === "all"
          ? {}
          : STATUS_TABS.includes(activeTab)
            ? { status: activeTab }
            : { category: activeTab };
      const rows = await getAdminContentWindow(filter, 200);
      setContent(rows);
    } catch (err) {
      console.error("Error loading content:", err);
      setError("Failed to load content");
      toast.error("Failed to load content", {
        description: "Please try again.",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const loadStatistics = useCallback(async () => {
    try {
      setStatistics(await getAdminContentCounts());
    } catch (err) {
      console.error("Error loading content counts:", err);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  // Realtime updates, debounced so bulk changes don't trigger a refetch storm
  useEffect(() => {
    const unsubscribe = EnhancedContentService.setupRealTimeUpdates(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        loadContent();
        loadStatistics();
      }, 1500);
    });

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      unsubscribe();
    };
  }, [loadContent, loadStatistics]);

  const handleUpdateStatus = async (id: string, status: ContentStatus) => {
    try {
      const updatedItem = await updateContentStatus(id, status);
      if (updatedItem) {
        setContent(prev => prev.map(item => (item.id === id ? updatedItem : item)));

        const actionText = status === "approved" ? "approved" : "rejected";
        toast.success(`Content ${actionText}`, {
          description: `Content has been successfully ${actionText}.`,
          duration: 2000,
        });
      }
    } catch (error) {
      console.error(`Error updating content status:`, error);
      toast.error("Update failed", {
        description: `Failed to ${status === "approved" ? "approve" : "reject"} content. Please try again.`,
        duration: 3000,
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const deleted = await deleteContent(id);
      if (deleted) {
        setContent(prev => prev.filter(item => item.id !== id));
        toast.success("Content deleted", {
          description: "Content has been successfully deleted.",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Error deleting content:", error);
      toast.error("Delete failed", {
        description: "Failed to delete content. Please try again.",
        duration: 3000,
      });
    }
  };

  const refreshContent = () => {
    loadContent();
    loadStatistics();
  };

  const getCurrentContent = () => content;

  const getContentStatistics = () => statistics;

  return {
    content,
    loading,
    error,
    handleUpdateStatus,
    handleDelete,
    refreshContent,
    activeTab,
    setActiveTab,
    getCurrentContent,
    getContentStatistics
  };
};
