
import { useState, useEffect } from "react";
import { ContentItem, ContentStatus, ContentCategory } from "@/interfaces/content";
import { getAllContent, updateContentStatus, deleteContent } from "@/services/contentService";
import { useEnhancedToast } from "@/hooks/useEnhancedToast";
import { EnhancedContentService } from "@/services/enhancedContentService";

export const useAdminContent = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("submit-content");
  const { showToast } = useEnhancedToast();

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const allContent = await getAllContent();
      setContent(allContent);
      console.log("Loaded content from Supabase:", allContent.length, "items");
    } catch (error) {
      console.error("Error loading content:", error);
      setError("Failed to load content");
      showToast({
        variant: "destructive",
        description: "Failed to load content. Please try again.",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();

    // Setup real-time updates
    const unsubscribe = EnhancedContentService.setupRealTimeUpdates((payload) => {
      console.log('Real-time update received:', payload);
      loadContent(); // Refresh content when changes occur
    });

    return unsubscribe;
  }, []);

  const handleUpdateStatus = async (id: string, status: ContentStatus) => {
    try {
      const updatedItem = await updateContentStatus(id, status);
      if (updatedItem) {
        setContent(prev => 
          prev.map(item => item.id === id ? updatedItem : item)
        );
        
        const actionText = status === "approved" ? "approved" : "rejected";
        showToast({
          variant: "success",
          description: `Content has been successfully ${actionText}.`,
          duration: 2000,
        });
      }
    } catch (error) {
      console.error(`Error ${status === "approved" ? "approving" : "rejecting"} content:`, error);
      showToast({
        variant: "destructive",
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
        showToast({
          variant: "success",
          description: "Content has been successfully deleted.",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Error deleting content:", error);
      showToast({
        variant: "destructive",
        description: "Failed to delete content. Please try again.",
        duration: 3000,
      });
    }
  };

  const refreshContent = () => {
    loadContent();
  };

  const getCurrentContent = () => {
    if (activeTab === "all") return content;
    if (activeTab === "pending" || activeTab === "approved" || activeTab === "rejected") {
      return content.filter(item => item.status === activeTab);
    }
    // Filter by category
    return content.filter(item => item.category === activeTab);
  };

  const getContentStatistics = () => {
    const pendingCount = content.filter(item => item.status === "pending").length;
    const scholarshipCount = content.filter(item => item.category === "scholarship").length;
    const mcqCount = content.filter(item => item.category === "mcq").length;
    const quizCount = content.filter(item => item.category === "quiz").length;
    const totalCount = content.length;

    return {
      pendingCount,
      scholarshipCount,
      mcqCount,
      quizCount,
      totalCount
    };
  };

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
