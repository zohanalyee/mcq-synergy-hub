import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SubjectManager from "./SubjectManager";
import TopicManager from "./TopicManager";
import JobTestManager from "./JobTestManager";
import QuestionBankManager from "./QuestionBankManager";
import AdminContentSubmission from "./AdminContentSubmission";
import { DataMigrationUtility } from "./DataMigrationUtility";
import AdminAnalyticsDashboard from "./analytics/AdminAnalyticsDashboard";
import ContentInventory from "./analytics/ContentInventory";
import DuplicateReviewQueue from "./DuplicateReviewQueue";
import { LMSStructureManager } from "./lms-structure/LMSStructureManager";
import { JobsManager } from "./jobs/JobsManager";
import { ScholarshipsManager } from "./scholarships/ScholarshipsManager";
import { Database, BarChart3, LayoutDashboard, FileText, Settings, Upload, BookOpen, FolderTree, Briefcase, AlertTriangle, Layers, Archive, BriefcaseBusiness, GraduationCap, Globe } from "lucide-react";
import { Link } from "react-router-dom";
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
        {/* Main Navigation */}
        <TabsTrigger value="dashboard" className="flex items-center gap-2">
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </TabsTrigger>
        <TabsTrigger value="question-bank" className="flex items-center gap-2 border-2 border-primary/20">
          <Database className="h-4 w-4" />
          Question Bank ⭐
        </TabsTrigger>
        <TabsTrigger value="review-duplicates" className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Review Duplicates
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Analytics
        </TabsTrigger>
        <TabsTrigger value="inventory" className="flex items-center gap-2">
          <Archive className="h-4 w-4" />
          Inventory
        </TabsTrigger>
        {/* Auto-Fill tab removed - AI features paused */}
        <TabsTrigger value="jobs" className="flex items-center gap-2">
          <BriefcaseBusiness className="h-4 w-4" />
          Jobs
        </TabsTrigger>
        <TabsTrigger value="scholarships" className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          Scholarships
        </TabsTrigger>
        <Link to="/admin/curation">
          <Button variant="outline" size="sm" className="flex items-center gap-2 border-2 border-primary/20">
            <Globe className="h-4 w-4 text-primary" />
            External Curation 🌐
          </Button>
        </Link>
        
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
        <TabsTrigger value="lms-structure" className="flex items-center gap-2 border-2 border-primary/20">
          <Layers className="h-4 w-4" />
          LMS Structure 🆕
        </TabsTrigger>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* AI Content Factory removed - AI features paused */}
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-5 w-5 text-primary" />
                Question Bank
              </CardTitle>
              <CardDescription className="text-xs">Manage all questions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setActiveTab("question-bank")} className="w-full" size="sm">
                Open Question Bank
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-primary" />
                Content Management
              </CardTitle>
              <CardDescription className="text-xs">Submit and upload content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" onClick={() => setActiveTab("submit-content")} className="w-full" size="sm">
                Submit Content
              </Button>
              <Button variant="outline" onClick={() => setActiveTab("bulk-upload")} className="w-full" size="sm">
                Bulk Upload
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-5 w-5 text-primary" />
                Configuration
              </CardTitle>
              <CardDescription className="text-xs">Manage subjects, topics & tests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" onClick={() => setActiveTab("subjects")} className="w-full" size="sm">
                Subjects
              </Button>
              <Button variant="outline" onClick={() => setActiveTab("topics")} className="w-full" size="sm">
                Topics
              </Button>
              <Button variant="outline" onClick={() => setActiveTab("job-tests")} className="w-full" size="sm">
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
        <AdminAnalyticsDashboard />
      </TabsContent>
      
      {/* Content Inventory Tab */}
      <TabsContent value="inventory">
        <ContentInventory />
      </TabsContent>
      
      {/* Auto-Fill Tab removed - AI features paused */}
      
      {/* Jobs Tab */}
      <TabsContent value="jobs">
        <JobsManager />
      </TabsContent>
      
      {/* Scholarships Tab */}
      <TabsContent value="scholarships">
        <ScholarshipsManager />
      </TabsContent>
      
      {/* Review Duplicates Tab */}
      <TabsContent value="review-duplicates">
        <DuplicateReviewQueue />
      </TabsContent>
      
      {/* Content Management */}
      <TabsContent value="submit-content">
        <AdminContentSubmission />
      </TabsContent>
      
      <TabsContent value="bulk-upload">
        <DataMigrationUtility />
      </TabsContent>
      
      {/* Configuration */}
      <TabsContent value="lms-structure">
        <LMSStructureManager />
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
    </Tabs>
  );
};

export default AdminTabs;