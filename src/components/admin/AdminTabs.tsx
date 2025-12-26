import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SubjectManager from "./SubjectManager";
import TopicManager from "./TopicManager";
import JobTestManager from "./JobTestManager";
import QuestionBankManager from "./QuestionBankManager";
import AdminContentSubmission from "./AdminContentSubmission";
import { DataMigrationUtility } from "./DataMigrationUtility";
import { Database, BarChart3, LayoutDashboard, FileText, Settings, Upload, BookOpen, FolderTree, Briefcase } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AdminTabsProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const AdminTabs = ({ activeTab, setActiveTab }: AdminTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-6 flex flex-wrap gap-2">
        {/* Main Navigation - 5 Items */}
        <TabsTrigger value="dashboard" className="flex items-center gap-2">
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </TabsTrigger>
        <TabsTrigger value="question-bank" className="flex items-center gap-2 border-2 border-primary/20">
          <Database className="h-4 w-4" />
          Question Bank ⭐
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Analytics
        </TabsTrigger>
        
        {/* Separator */}
        <div className="w-px h-8 bg-border mx-2" />
        
        {/* Content Management Group */}
        <TabsTrigger value="submit-content" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Submit
        </TabsTrigger>
        <TabsTrigger value="bulk-upload" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Bulk Upload
        </TabsTrigger>
        
        {/* Separator */}
        <div className="w-px h-8 bg-border mx-2" />
        
        {/* Configuration Group */}
        <TabsTrigger value="subjects" className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Subjects
        </TabsTrigger>
        <TabsTrigger value="topics" className="flex items-center gap-2">
          <FolderTree className="h-4 w-4" />
          Topics
        </TabsTrigger>
        <TabsTrigger value="job-tests" className="flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Job Tests
        </TabsTrigger>
      </TabsList>

      {/* Dashboard Tab */}
      <TabsContent value="dashboard">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Question Bank
              </CardTitle>
              <CardDescription>Manage all questions in one place</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setActiveTab("question-bank")} className="w-full">
                Open Question Bank
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Content Management
              </CardTitle>
              <CardDescription>Submit and upload content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" onClick={() => setActiveTab("submit-content")} className="w-full">
                Submit Content
              </Button>
              <Button variant="outline" onClick={() => setActiveTab("bulk-upload")} className="w-full">
                Bulk Upload
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Configuration
              </CardTitle>
              <CardDescription>Manage subjects, topics & tests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" onClick={() => setActiveTab("subjects")} className="w-full">
                Subjects
              </Button>
              <Button variant="outline" onClick={() => setActiveTab("topics")} className="w-full">
                Topics
              </Button>
              <Button variant="outline" onClick={() => setActiveTab("job-tests")} className="w-full">
                Job Tests
              </Button>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      {/* Question Bank Tab */}
      <TabsContent value="question-bank">
        <QuestionBankManager />
      </TabsContent>
      
      {/* Analytics Tab */}
      <TabsContent value="analytics">
        <div className="p-6 bg-card rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Analytics Dashboard</h3>
          <p className="text-muted-foreground">
            Comprehensive analytics and reporting tools for question usage, user performance, 
            and content effectiveness will be available here.
          </p>
        </div>
      </TabsContent>
      
      {/* Content Management */}
      <TabsContent value="submit-content">
        <AdminContentSubmission />
      </TabsContent>
      
      <TabsContent value="bulk-upload">
        <DataMigrationUtility />
      </TabsContent>
      
      {/* Configuration */}
      <TabsContent value="subjects">
        <SubjectManager />
      </TabsContent>
      
      <TabsContent value="topics">
        <TopicManager />
      </TabsContent>
      
      <TabsContent value="job-tests">
        <JobTestManager />
      </TabsContent>
    </Tabs>
  );
};

export default AdminTabs;
