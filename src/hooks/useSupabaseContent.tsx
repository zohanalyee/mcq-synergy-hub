
import { useState, useEffect } from "react";
import { ContentItem, ContentStatus } from "@/interfaces/content";
import { 
  getAllContent, 
  updateContentStatus, 
  deleteContent,
  getContentByCategory 
} from "@/services/contentService";
import { toast } from "sonner";
import { toast } from "sonner";

export const useSupabaseContent = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load content from Supabase
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
      toast.error("Error", { description: "Failed to load content. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  // Update content status
  const handleUpdateStatus = async (id: string, status: ContentStatus) => {
    try {
      const updatedItem = await updateContentStatus(id, status);
      if (updatedItem) {
        setContent(prev => 
          prev.map(item => item.id === id ? updatedItem : item)
        );
        
        const actionText = status === "approved" ? "approved" : "rejected";
        toast.success(`Content ${actionText}`, {
          description: `The content has been successfully ${actionText}.`
        });
      }
    } catch (error) {
      console.error(`Error ${status === "approved" ? "approving" : "rejecting"} content:`, error);
      toast.error("Error", { description: `Failed to ${status === "approved" ? "approve" : "reject"} content. Please try again.` });
    }
  };

  // Delete content
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
      toast.error("Error", { description: "Failed to delete content. Please try again." });
    }
  };

  // Bulk actions
  const handleBulkAction = async (action: string, selectedIds: string[]) => {
    try {
      switch (action) {
        case 'approve':
          for (const id of selectedIds) {
            await handleUpdateStatus(id, 'approved');
          }
          toast.success(`${selectedIds.length} items approved`);
          break;
          
        case 'reject':
          for (const id of selectedIds) {
            await handleUpdateStatus(id, 'rejected');
          }
          toast.success(`${selectedIds.length} items rejected`);
          break;
          
        case 'delete':
          for (const id of selectedIds) {
            await handleDelete(id);
          }
          toast.success(`${selectedIds.length} items deleted`);
          break;
          
        case 'export':
          // Simple CSV export
          const itemsToExport = content.filter(item => selectedIds.includes(item.id));
          const csvContent = [
            ['Title', 'Category', 'Status', 'Created At', 'Description'].join(','),
            ...itemsToExport.map(item => [
              `"${item.title}"`,
              item.category,
              item.status,
              item.createdAt,
              `"${item.description?.replace(/"/g, '""') || ''}"`
            ].join(','))
          ].join('\n');
          
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `content-export-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          
          toast.success("Content exported successfully");
          break;
      }
    } catch (error) {
      console.error("Error performing bulk action:", error);
      toast.error("Error", { description: "Failed to perform bulk action. Please try again." });
    }
  };

  // Filter content based on status
  const filterContentByStatus = (status: string) => {
    if (status === 'all') return content;
    return content.filter(item => item.status === status);
  };

  // Filter content based on category
  const filterContentByCategory = (category: string) => {
    return content.filter(item => item.category === category);
  };

  // Refresh content
  const refreshContent = () => {
    loadContent();
  };

  return {
    content,
    loading,
    error,
    handleUpdateStatus,
    handleDelete,
    handleBulkAction,
    filterContentByStatus,
    filterContentByCategory,
    refreshContent
  };
};
