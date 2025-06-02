
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminTabs from "@/components/admin/AdminTabs";
import ContentTable from "@/components/admin/content/ContentTable";
import { ContentItem } from "@/interfaces/content";

type AdminContentProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentContent: ContentItem[];
  handleEditClick: (item: ContentItem) => void;
  handleUpdateStatus: (id: string, status: "approved" | "rejected" | "pending") => void;
  handleDelete: (id: string) => void;
};

const AdminContent = ({
  activeTab,
  setActiveTab,
  currentContent,
  handleEditClick,
  handleUpdateStatus,
  handleDelete
}: AdminContentProps) => {
  const isContentTab = activeTab === "pending" || activeTab === "approved" || 
                      activeTab === "rejected" || activeTab === "scholarship" || 
                      activeTab === "mcq" || activeTab === "past_paper" || 
                      activeTab === "job" || activeTab === "quiz";

  const isSubmitTab = activeTab === "submit-content";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Content Management</CardTitle>
      </CardHeader>
      <CardContent>
        <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {isContentTab && (
          <ContentTable 
            content={currentContent}
            onEditClick={handleEditClick}
            onUpdateStatus={handleUpdateStatus}
            onDelete={handleDelete}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default AdminContent;
