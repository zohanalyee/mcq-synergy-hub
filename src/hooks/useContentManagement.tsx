
import { useState, useEffect } from "react";
import { ContentItem, ContentStatus } from "@/interfaces/content";
import { getAllContent, updateContentStatus, deleteContent } from "@/services/supabaseContentService";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";

export const useContentManagement = () => {
  const { toast: hookToast } = useToast();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [currentItem, setCurrentItem] = useState<ContentItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load content from Supabase
  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        const allContent = await getAllContent();
        setContent(allContent);
        console.log("Loaded content items from Supabase:", allContent.length);
      } catch (error) {
        console.error("Error loading content:", error);
        hookToast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load content. Please try again."
        });
      } finally {
        setLoading(false);
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
      hookToast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${status === "approved" ? "approve" : "reject"} content. Please try again.`
      });
    }
  };

  // Enhanced save with full content update support
  const handleSaveEdit = async (updatedData: Partial<ContentItem>) => {
    if (!currentItem) return;
    
    try {
      const updatedItem = await updateContentStatus(currentItem.id, currentItem.status, updatedData);
      
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

  // Delete content with confirmation and proper error handling
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content? This action cannot be undone.")) {
      return;
    }

    try {
      const result = await deleteContent(id);
      
      if (result.success) {
        setContent(prev => prev.filter(item => item.id !== id));
        toast.success("Content deleted", {
          description: "The content has been successfully deleted."
        });
      } else {
        toast.error("Delete failed", {
          description: result.error || "Failed to delete content."
        });
      }
    } catch (error) {
      console.error("Error deleting content:", error);
      toast.error("Delete failed", {
        description: "An unexpected error occurred while deleting content."
      });
    }
  };

  // New bulk action handler
  const handleBulkAction = async (action: string, selectedIds: string[]) => {
    try {
      switch (action) {
        case 'approve':
          for (const id of selectedIds) {
            const updatedItem = await updateContentStatus(id, 'approved');
            if (updatedItem) {
              setContent(prev => prev.map(item => item.id === id ? updatedItem : item));
            }
          }
          toast.success(`${selectedIds.length} items approved`);
          break;
          
        case 'reject':
          for (const id of selectedIds) {
            const updatedItem = await updateContentStatus(id, 'rejected');
            if (updatedItem) {
              setContent(prev => prev.map(item => item.id === id ? updatedItem : item));
            }
          }
          toast.success(`${selectedIds.length} items rejected`);
          break;
          
        case 'delete':
          // Add confirmation for bulk delete
          if (!confirm(`Are you sure you want to delete ${selectedIds.length} items? This action cannot be undone.`)) {
            return;
          }
          
          let deleteSuccessCount = 0;
          let deleteErrors: string[] = [];
          
          for (const id of selectedIds) {
            const result = await deleteContent(id);
            if (result.success) {
              deleteSuccessCount++;
            } else {
              deleteErrors.push(result.error || `Failed to delete item ${id}`);
            }
          }
          
          if (deleteSuccessCount > 0) {
            setContent(prev => prev.filter(item => !selectedIds.includes(item.id)));
            toast.success(`${deleteSuccessCount} items deleted successfully`);
          }
          
          if (deleteErrors.length > 0) {
            toast.error(`${deleteErrors.length} items failed to delete`, {
              description: deleteErrors.join(", ")
            });
          }
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
      hookToast({
        variant: "destructive",
        title: "Error",
        description: "Failed to perform bulk action. Please try again."
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
    loading,
    currentItem,
    editDialogOpen,
    setEditDialogOpen,
    handleEditClick,
    handleUpdateStatus,
    handleSaveEdit,
    handleDelete,
    handleBulkAction,
    filterContentByStatus,
    filterContentByCategory
  };
};
