
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SubjectManager from "./SubjectManager";
import TopicManager from "./TopicManager";
import JobTestManager from "./JobTestManager";
import QuizManager from "./QuizManager";
import AdminContentSubmission from "./AdminContentSubmission";
import { GraduationCap, FileText, List, Plus } from "lucide-react";

type AdminTabsProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const AdminTabs = ({ activeTab, setActiveTab }: AdminTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-6 flex flex-wrap">
        <TabsTrigger value="submit-content" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Submit Content
        </TabsTrigger>
        <TabsTrigger value="pending">Submissions</TabsTrigger>
        <TabsTrigger value="approved">Approved</TabsTrigger>
        <TabsTrigger value="rejected">Rejected</TabsTrigger>
        <TabsTrigger value="scholarship">Scholarships</TabsTrigger>
        <TabsTrigger value="mcq">MCQs</TabsTrigger>
        <TabsTrigger value="quiz">Quizzes</TabsTrigger>
        <TabsTrigger value="job">Jobs</TabsTrigger>
        <TabsTrigger value="past_paper">Past Papers</TabsTrigger>
        <TabsTrigger value="subjects">Subject Manager</TabsTrigger>
        <TabsTrigger value="topics">Topic Manager</TabsTrigger>
        <TabsTrigger value="job-tests">Job Tests</TabsTrigger>
      </TabsList>
      
      <TabsContent value="submit-content">
        <AdminContentSubmission />
      </TabsContent>
      
      <TabsContent value="pending">
        {/* Content management is in the main AdminPanel component */}
      </TabsContent>
      
      <TabsContent value="approved">
        {/* Content management is in the main AdminPanel component */}
      </TabsContent>
      
      <TabsContent value="rejected">
        {/* Content management is in the main AdminPanel component */}
      </TabsContent>
      
      <TabsContent value="scholarship">
        {/* Content management is in the main AdminPanel component */}
      </TabsContent>
      
      <TabsContent value="mcq">
        {/* Content management is in the main AdminPanel component */}
      </TabsContent>
      
      <TabsContent value="quiz">
        {/* Content management is in the main AdminPanel component */}
      </TabsContent>
      
      <TabsContent value="job">
        {/* Content management is in the main AdminPanel component */}
      </TabsContent>
      
      <TabsContent value="past_paper">
        {/* Content management is in the main AdminPanel component */}
      </TabsContent>
      
      <TabsContent value="subjects">
        <SubjectManager />
      </TabsContent>
      
      <TabsContent value="topics">
        <TopicManager />
      </TabsContent>
      
      <TabsContent value="job-tests">
        <JobTestManager />
      </TabsContent>
      
      <TabsContent value="quizzes">
        <QuizManager />
      </TabsContent>
    </Tabs>
  );
};

export default AdminTabs;
