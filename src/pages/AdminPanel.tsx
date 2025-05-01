
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, X, Edit, Trash, Shield, FileEdit, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import Header from "@/components/Header";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ContentItem, ContentStatus } from "@/interfaces/content";
import { getAllContent, updateContentStatus, deleteContent } from "@/services/contentService";
import { useUserRole } from "@/contexts/UserRoleContext";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { toast: hookToast } = useToast();
  const { userRole, isAdmin } = useUserRole();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [currentItem, setCurrentItem] = useState<ContentItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      toast.error("Access denied", {
        description: "You must be an admin to access this page."
      });
      navigate("/");
    }
  }, [isAdmin, navigate]);

  // Load content
  useEffect(() => {
    const loadContent = () => {
      try {
        const allContent = getAllContent();
        setContent(allContent);
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

  // Filter content based on tab and search term
  const filteredContent = content
    .filter(item => {
      if (activeTab === "all") return true;
      return item.status === activeTab;
    })
    .filter(item => {
      if (!searchTerm) return true;
      return (
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });

  // Open edit dialog
  const handleEditClick = (item: ContentItem) => {
    setCurrentItem(item);
    setEditTitle(item.title);
    setEditDescription(item.description);
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
  const handleSaveEdit = () => {
    if (!currentItem) return;
    
    try {
      const updatedItem = updateContentStatus(currentItem.id, currentItem.status, {
        title: editTitle,
        description: editDescription
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

  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = (status: ContentStatus) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-amber-500 hover:bg-amber-600">Pending</Badge>;
      default:
        return null;
    }
  };

  const breadcrumbItems = [
    { title: "Home", href: "/" },
    { title: "Admin Panel", href: "/admin", isCurrent: true },
  ];

  if (!isAdmin) {
    return null; // Don't render anything while redirecting
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-16">
        <PageBreadcrumb items={breadcrumbItems} />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                Admin Panel
              </h1>
              <p className="text-muted-foreground">
                Review, approve, edit or reject user submissions.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-3 py-1.5">
                <span className="text-primary font-semibold text-lg mr-1.5">
                  {content.filter(item => item.status === 'pending').length}
                </span> Pending
              </Badge>
              <Badge variant="outline" className="px-3 py-1.5">
                <span className="text-primary font-semibold text-lg mr-1.5">
                  {content.length}
                </span> Total
              </Badge>
            </div>
          </div>
          
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle>Content Management</CardTitle>
                <Input
                  placeholder="Search content..."
                  className="max-w-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
                
                <TabsContent value={activeTab}>
                  {filteredContent.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead className="hidden md:table-cell">Category</TableHead>
                            <TableHead className="hidden md:table-cell">Date</TableHead>
                            <TableHead className="hidden md:table-cell">Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredContent.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{item.title}</div>
                                  <div className="text-sm text-muted-foreground hidden md:block">
                                    {item.description.length > 50 
                                      ? `${item.description.substring(0, 50)}...` 
                                      : item.description}
                                  </div>
                                  <div className="md:hidden">
                                    <Badge>{item.category}</Badge>
                                    <div className="mt-1">{getStatusBadge(item.status)}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <Badge>{item.category}</Badge>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {formatDate(item.createdAt)}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {getStatusBadge(item.status)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {item.status === "pending" && (
                                    <>
                                      <Button 
                                        size="icon" 
                                        variant="default" 
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => handleUpdateStatus(item.id, "approved")}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        size="icon" 
                                        variant="destructive"
                                        onClick={() => handleUpdateStatus(item.id, "rejected")}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                  <Button 
                                    size="icon" 
                                    variant="outline"
                                    onClick={() => handleEditClick(item)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="outline"
                                    onClick={() => handleDelete(item.id)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileEdit className="h-16 w-16 mx-auto text-muted-foreground/40" />
                      <h3 className="mt-4 text-lg font-medium">No content found</h3>
                      <p className="mt-2 text-muted-foreground">
                        {activeTab === "pending" 
                          ? "There are no pending submissions waiting for approval." 
                          : `There are no ${activeTab} content items${searchTerm ? " matching your search" : ""}.`}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Edit Content Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
            <DialogDescription>
              Make changes to the selected content item.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Title</label>
              <Input
                id="title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <Textarea
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="min-h-[200px]"
              />
            </div>
            
            {currentItem?.imageUrl && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Image Preview</label>
                <div className="border rounded-md p-2">
                  <img 
                    src={currentItem.imageUrl} 
                    alt="Content" 
                    className="max-h-40 mx-auto object-contain" 
                  />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminPanel;
