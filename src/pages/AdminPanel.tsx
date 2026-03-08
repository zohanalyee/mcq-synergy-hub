
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

  useEffect(() => {
    initializeAdminData();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    if (!user) {
      toast.error("Access denied", {
        description: "You must be logged in to access this page."
      });
      navigate("/sign-in");
      return;
    }
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

  if (!isAdmin || !user) {
    return null;
  }

  return (
    <Header>
      <div className="relative min-h-screen">
        {/* AI-themed background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-950/5 via-transparent to-cyan-950/5 dark:from-violet-950/20 dark:via-transparent dark:to-cyan-950/10" />
          <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(139,92,246,0.4) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative z-10 max-w-[1600px] mx-auto px-4 pt-4 pb-10 space-y-4">
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
