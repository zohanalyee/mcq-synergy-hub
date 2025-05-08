
import { useState, useEffect } from "react";
import { ContentItem, ContentStatus } from "@/interfaces/content";
import { getAllContent, updateContentStatus, deleteContent } from "@/services/baseContentService";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";

export const useContentManagement = () => {
  const { toast: hookToast } = useToast();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [currentItem, setCurrentItem] = useState<ContentItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Load content
  useEffect(() => {
    const loadContent = () => {
      try {
        const allContent = getAllContent();
        setContent(allContent);
        console.log("Loaded content items:", allContent.length);
      } catch (error) {
        console.error("Error loading content:", error);
        hookToast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load content. Please try again."
        });
      }
    };

    loadContent();
  }, []);

  // Open edit dialog
  const handleEditClick = (item: ContentItem) => {
    setCurrentItem(item);
    setEditDialogOpen(true);
  };

  // Update content status
  const handleUpdateStatus = async (id: string, status: ContentStatus) => {
    try {
      const updatedItem = updateContentStatus(id, status);
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
      hookToast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${status === "approved" ? "approve" : "reject"} content. Please try again.`
      });
    }
  };

  // Save edited content
  const handleSaveEdit = (title: string, description: string) => {
    if (!currentItem) return;
    
    try {
      const updatedItem = updateContentStatus(currentItem.id, currentItem.status, {
        title,
        description
      });
      
      if (updatedItem) {
        setContent(prev => 
          prev.map(item => item.id === currentItem.id ? updatedItem : item)
        );
        
        toast.success("Content updated", {
          description: "The content has been successfully updated."
        });
        
        setEditDialogOpen(false);
      }
    } catch (error) {
      console.error("Error updating content:", error);
      hookToast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update content. Please try again."
      });
    }
  };

  // Delete content
  const handleDelete = (id: string) => {
    try {
      const deleted = deleteContent(id);
      if (deleted) {
        setContent(prev => prev.filter(item => item.id !== id));
        toast.success("Content deleted", {
          description: "The content has been successfully deleted."
        });
      }
    } catch (error) {
      console.error("Error deleting content:", error);
      hookToast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete content. Please try again."
      });
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

  return {
    content,
    currentItem,
    editDialogOpen,
    setEditDialogOpen,
    handleEditClick,
    handleUpdateStatus,
    handleSaveEdit,
    handleDelete,
    filterContentByStatus,
    filterContentByCategory
  };
};
