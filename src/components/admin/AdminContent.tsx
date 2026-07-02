
import { ContentItem, ContentStatus } from "@/interfaces/content";
import AdminTabs from "./AdminTabs";
import EnhancedContentTable from "./content/EnhancedContentTable";

interface AdminContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentContent: ContentItem[];
  handleEditClick: (item: ContentItem) => void;
  handleUpdateStatus: (id: string, status: ContentStatus) => void;
  handleDelete: (id: string) => void;
  onBulkAction?: (action: string, selectedIds: string[]) => void;
}

const AdminContent = ({
  activeTab,
  setActiveTab,
  currentContent,
  handleEditClick,
  handleUpdateStatus,
  handleDelete,
  onBulkAction
}: AdminContentProps) => {
  
  // Don't show table for submit-content tab or management tabs
  const isContentTab = !['submit-content', 'subjects', 'topics', 'job-tests', 'quizzes', 'question-bank', 'analytics', 'data-migration', 'review-duplicates', 'bulk-upload', 'dashboard', 'lms-structure', 'jobs', 'scholarships', 'inventory', 'documents', 'messages', 'feedback-analytics', 'study-sounds', 'empty-topics', 'add-content', 'opportunity-review'].includes(activeTab);

  const getCurrentContent = () => currentContent;

  return (
    <div className="space-y-4">
      <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {isContentTab && (
        <EnhancedContentTable
          content={currentContent}
          onEditClick={handleEditClick}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDelete}
          onBulkAction={onBulkAction}
        />
      )}
    </div>
  );
};

export default AdminContent;
