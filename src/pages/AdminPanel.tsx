import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserRole } from "@/contexts/UserRoleContext";
import AdminTabs from "@/components/admin/AdminTabs";
import { subjects } from "@/data/subjectsData";
import { mockTopics } from "@/data/topicsData";
import { jobTests } from "@/data/jobTestsData";
import { initializeAdminData } from "@/services/adminService";
import ContentTable from "@/components/admin/content/ContentTable";
import EditContentDialog from "@/components/admin/content/EditContentDialog";
import { useContentManagement } from "@/hooks/useContentManagement";
import { getTopics } from "@/services/topicService";
import { getQuizzes, getQuizzesBySubject, getQuizzesByTopic } from "@/services/quizService";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const [activeTab, setActiveTab] = useState("pending");

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
    // Call initializeAdminData without parameters as it doesn't need them
    initializeAdminData();
  }, []);

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      toast.error("Access denied", {
        description: "You must be an admin to access this page."
      });
      navigate("/");
    }
  }, [isAdmin, navigate]);

  const breadcrumbItems = [
    { title: "Home", href: "/" },
    { title: "Admin Panel", href: "/admin", isCurrent: true },
  ];

  // Get content for the current active tab
  const currentContent = filterContentByStatus(activeTab !== "subjects" && 
                                             activeTab !== "topics" && 
                                             activeTab !== "job-tests" && 
                                             activeTab !== "quizzes" ? activeTab : "all");

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
