
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Header from "@/components/Header";
import { useUserRole } from "@/contexts/UserRoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { initializeAdminData } from "@/services/adminService";
import EnhancedEditContentDialog from "@/components/admin/content/EnhancedEditContentDialog";
import { useContentManagement } from "@/hooks/useContentManagement";
import { useAdminContent } from "@/hooks/useAdminContent";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminContent from "@/components/admin/AdminContent";
import AdminLoader from "@/components/admin/AdminLoader";
import QuotaMonitor from "@/components/admin/QuotaMonitor";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, checkIsAdmin } = useUserRole();
  const [isLoading, setIsLoading] = useState(true);

  const {
    currentItem,
    editDialogOpen,
    setEditDialogOpen,
    handleEditClick,
    handleUpdateStatus,
    handleSaveEdit,
    handleDelete,
    handleBulkAction,
  } = useContentManagement();

  const {
    activeTab,
    setActiveTab,
    getCurrentContent,
    getContentStatistics
  } = useAdminContent();

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

  const currentContent = getCurrentContent();
  const statistics = getContentStatistics();

  if (isLoading) {
    return <AdminLoader />;
  }

  // If security check failed, don't render anything else
  if (!isAdmin || !user) {
    return null;
  }

  return (
    <Header>
      <div className="max-w-[1600px] mx-auto px-4 pt-4 pb-10 space-y-5">
        <AdminHeader
          pendingCount={statistics.pendingCount}
          scholarshipCount={statistics.scholarshipCount}
          mcqCount={statistics.mcqCount}
          quizCount={statistics.quizCount}
          totalCount={statistics.totalCount}
        />
        
        <QuotaMonitor />
        
        <AdminContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentContent={currentContent}
          handleEditClick={handleEditClick}
          handleUpdateStatus={handleUpdateStatus}
          handleDelete={handleDelete}
          onBulkAction={handleBulkAction}
        />
      </div>

      <EnhancedEditContentDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        currentItem={currentItem}
        onSave={handleSaveEdit}
      />
    </Header>
  );
};

export default AdminPanel;
