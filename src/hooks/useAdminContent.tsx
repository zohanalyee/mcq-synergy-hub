
import { useState, useEffect } from "react";
import { ContentItem, ContentStatus, ContentCategory } from "@/interfaces/content";
import { getAllContent, updateContentStatus, deleteContent } from "@/services/contentService";
import { toast } from "sonner";

export const useAdminContent = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("submit-content");

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const allContent = await getAllContent();
      setContent(allContent);
    } catch (error) {
      console.error("Error loading content:", error);
      setError("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const handleUpdateStatus = async (id: string, status: ContentStatus) => {
    try {
      const updatedItem = await updateContentStatus(id, status);
      if (updatedItem) {
        setContent(prev => 
          prev.map(item => item.id === id ? updatedItem : item)
        );
        toast.success(`Content ${status}`, {
          description: `The content has been successfully ${status}.`
        });
      }
    } catch (error) {
      console.error(`Error ${status} content:`, error);
      toast.error(`Failed to ${status} content`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const deleted = await deleteContent(id);
      if (deleted) {
        setContent(prev => prev.filter(item => item.id !== id));
        toast.success("Content deleted", {
          description: "The content has been successfully deleted."
        });
      }
    } catch (error) {
      console.error("Error deleting content:", error);
      toast.error("Failed to delete content");
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
