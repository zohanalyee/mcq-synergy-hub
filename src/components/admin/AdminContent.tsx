
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
  const isContentTab = !['submit-content', 'subjects', 'topics', 'job-tests', 'quizzes', 'question-bank', 'analytics', 'data-migration', 'review-duplicates', 'bulk-upload', 'dashboard'].includes(activeTab);

  const getCurrentContent = () => currentContent;

  return (
    <div className="space-y-6">
      <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {activeTab === 'analytics' && (
        <div className="p-6 bg-card rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Analytics Dashboard</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-primary">Question Bank Usage</h4>
              <p className="text-2xl font-bold">{getCurrentContent().filter(item => item.category === 'mcq').length}</p>
              <p className="text-sm text-muted-foreground">Total Questions</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-primary">Modules Connected</h4>
              <p className="text-2xl font-bold">4</p>
              <p className="text-sm text-muted-foreground">Using Question Bank</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-primary">Questions Reused</h4>
              <p className="text-2xl font-bold">100%</p>
              <p className="text-sm text-muted-foreground">Across All Modules</p>
            </div>
          </div>
          <p className="text-muted-foreground">
            The Question Bank ensures consistent question quality and eliminates duplication across 
            all learning modules. Analytics show usage patterns and help optimize content distribution.
          </p>
        </div>
      )}
      
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
