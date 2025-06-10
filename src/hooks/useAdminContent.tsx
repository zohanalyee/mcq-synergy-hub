
import { useState, useEffect } from "react";
import { ContentItem, ContentStatus } from "@/interfaces/content";
import { getAllContent, updateContentStatus, deleteContent } from "@/services/contentService";
import { toast } from "sonner";

export const useAdminContent = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return {
    content,
    loading,
    error,
    handleUpdateStatus,
    handleDelete,
    refreshContent
  };
};
