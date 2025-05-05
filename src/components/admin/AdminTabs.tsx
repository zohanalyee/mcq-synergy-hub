
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SubjectManager from "./SubjectManager";
import TopicManager from "./TopicManager";
import JobTestManager from "./JobTestManager";
import QuizManager from "./QuizManager";

type AdminTabsProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const AdminTabs = ({ activeTab, setActiveTab }: AdminTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-6">
        <TabsTrigger value="pending">Submissions</TabsTrigger>
        <TabsTrigger value="subjects">Subjects</TabsTrigger>
        <TabsTrigger value="topics">Topics</TabsTrigger>
        <TabsTrigger value="job-tests">Job Tests</TabsTrigger>
        <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
      </TabsList>
      
      <TabsContent value="pending">
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
