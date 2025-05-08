
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserRole } from "@/contexts/UserRoleContext";
import { useAuth } from "@/contexts/AuthContext";
import AdminTabs from "@/components/admin/AdminTabs";
import { initializeAdminData } from "@/services/adminService";
import ContentTable from "@/components/admin/content/ContentTable";
import EditContentDialog from "@/components/admin/content/EditContentDialog";
import { useContentManagement } from "@/hooks/useContentManagement";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, checkIsAdmin } = useUserRole();
  const [activeTab, setActiveTab] = useState("pending");
  const [isLoading, setIsLoading] = useState(true);

  const {
    content,
    currentItem,
    editDialogOpen,
    setEditDialogOpen,
    handleEditClick,
    handleUpdateStatus,
    handleSaveEdit,
    handleDelete,
    filterContentByStatus
  } = useContentManagement();

  // Initialize admin data when the component loads
  useEffect(() => {
    initializeAdminData();
  }, []);

  // Security check: Verify admin status on every render
  useEffect(() => {
    setIsLoading(true);
    
    // Make sure user is authenticated first
    if (!user) {
      toast.error("Access denied", {
        description: "You must be logged in to access this page."
      });
      navigate("/sign-in");
      return;
    }
    
    // Then verify admin status
    const adminCheck = checkIsAdmin();
    
    if (!adminCheck) {
      toast.error("Access denied", {
        description: "You do not have administrator privileges."
      });
      navigate("/");
    }
    
    setIsLoading(false);
  }, [user, navigate, checkIsAdmin]);

  const breadcrumbItems = [
    { title: "Home", href: "/" },
    { title: "Admin Panel", href: "/admin", isCurrent: true },
  ];

  // Get content for the current active tab
  const currentContent = filterContentByStatus(activeTab);

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 pt-28 pb-16 flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verifying admin access...</p>
          </div>
        </div>
      </>
    );
  }

  // If security check failed, don't render anything else
  if (!isAdmin || !user) {
    return null;
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
                Manage content, subjects, topics, and job tests.
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
              <CardTitle>Content Management</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} />
              
              {activeTab === "pending" || activeTab === "approved" || 
               activeTab === "rejected" || activeTab === "all" ? (
                <ContentTable 
                  content={currentContent}
                  onEditClick={handleEditClick}
                  onUpdateStatus={handleUpdateStatus}
                  onDelete={handleDelete}
                />
               ) : null}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <EditContentDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        currentItem={currentItem}
        onSave={handleSaveEdit}
      />
    </>
  );
};

export default AdminPanel;
