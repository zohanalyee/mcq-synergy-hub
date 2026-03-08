import { Tabs, TabsContent } from "@/components/ui/tabs";
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
import DocumentLibrary from "./documents/DocumentLibrary";
import LMSApprovalDashboard from "./LMSApprovalDashboard";
import AIContentFactory from "./AIContentFactory";
import {
  Database, BarChart3, LayoutDashboard, FileText, Upload, BookOpen,
  FolderTree, Briefcase, AlertTriangle, Layers, Archive,
  BriefcaseBusiness, GraduationCap, Globe, Library, ShieldCheck,
  Sparkles, Zap, Navigation, Settings,
} from "lucide-react";
import AutoFillDashboard from "./auto-fill/AutoFillDashboard";
import DocumentMCQConverter from "./DocumentMCQConverter";
import NavigationManager from "./NavigationManager";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminTabsProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

interface TabItem {
  value: string;
  label: string;
  icon: React.ElementType;
}

interface TabGroup {
  label: string;
  colorClass: string;
  activeColorClass: string;
  iconColorClass: string;
  items: TabItem[];
  extra?: React.ReactNode;
}

const AdminTabs = ({ activeTab, setActiveTab }: AdminTabsProps) => {
  const groups: TabGroup[] = [
    {
      label: "Overview",
      colorClass: "hover:bg-blue-50 dark:hover:bg-blue-950/30",
      activeColorClass: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shadow-sm",
      iconColorClass: "text-blue-500",
      items: [
        { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { value: "analytics", label: "Analytics", icon: BarChart3 },
        { value: "inventory", label: "Inventory", icon: Archive },
      ],
    },
    {
      label: "Content",
      colorClass: "hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
      activeColorClass: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 shadow-sm",
      iconColorClass: "text-emerald-500",
      items: [
        { value: "question-bank", label: "Question Bank", icon: Database },
        { value: "review-duplicates", label: "Review Duplicates", icon: AlertTriangle },
        { value: "submit-content", label: "Submit", icon: FileText },
        { value: "bulk-upload", label: "Bulk Upload", icon: Upload },
      ],
    },
    {
      label: "AI & Generation",
      colorClass: "hover:bg-violet-50 dark:hover:bg-violet-950/30",
      activeColorClass: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 shadow-sm",
      iconColorClass: "text-violet-500",
      items: [
        { value: "generate-mcqs", label: "Generate MCQs", icon: Sparkles },
        { value: "smart-generation", label: "Smart Generation", icon: Zap },
        { value: "doc-to-mcq", label: "Doc → MCQ", icon: FileText },
        { value: "documents", label: "Documents", icon: Library },
      ],
    },
    {
      label: "External",
      colorClass: "hover:bg-amber-50 dark:hover:bg-amber-950/30",
      activeColorClass: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 shadow-sm",
      iconColorClass: "text-amber-500",
      items: [
        { value: "jobs", label: "Jobs", icon: BriefcaseBusiness },
        { value: "scholarships", label: "Scholarships", icon: GraduationCap },
      ],
      extra: (
        <Link to="/admin/curation">
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-amber-50 dark:hover:bg-amber-950/30">
            <Globe className="h-3.5 w-3.5 text-amber-500" />
            External Curation
          </button>
        </Link>
      ),
    },
    {
      label: "Structure",
      colorClass: "hover:bg-slate-50 dark:hover:bg-slate-800/40",
      activeColorClass: "bg-slate-200 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 shadow-sm",
      iconColorClass: "text-slate-500",
      items: [
        { value: "lms-structure", label: "LMS Structure", icon: Layers },
        { value: "lms-approvals", label: "LMS Approvals", icon: ShieldCheck },
        { value: "subjects", label: "Subjects", icon: BookOpen },
        { value: "topics", label: "Topics", icon: FolderTree },
        { value: "job-tests", label: "Job Tests", icon: Briefcase },
        { value: "navigation", label: "Navigation", icon: Navigation },
      ],
    },
  ];

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      {/* Grouped Tab Navigation */}
      <div className="mb-4 space-y-2 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-3">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 px-1">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => setActiveTab(item.value)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                      isActive ? group.activeColorClass : cn("text-muted-foreground", group.colorClass)
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", isActive ? "" : group.iconColorClass)} />
                    {item.label}
                  </button>
                );
              })}
              {group.extra}
            </div>
          </div>
        ))}
      </div>

      {/* Dashboard Tab */}
      <TabsContent value="dashboard">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <AIContentFactory />
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

      <TabsContent value="question-bank"><QuestionBankManager /></TabsContent>
      <TabsContent value="analytics"><AdminAnalyticsDashboard /></TabsContent>
      <TabsContent value="inventory"><ContentInventory /></TabsContent>
      <TabsContent value="documents"><DocumentLibrary /></TabsContent>
      <TabsContent value="generate-mcqs"><AIContentFactory /></TabsContent>
      <TabsContent value="smart-generation"><AutoFillDashboard /></TabsContent>
      <TabsContent value="doc-to-mcq"><DocumentMCQConverter /></TabsContent>
      <TabsContent value="jobs"><JobsManager /></TabsContent>
      <TabsContent value="scholarships"><ScholarshipsManager /></TabsContent>
      <TabsContent value="review-duplicates"><DuplicateReviewQueue /></TabsContent>
      <TabsContent value="submit-content"><AdminContentSubmission /></TabsContent>
      <TabsContent value="bulk-upload"><DataMigrationUtility /></TabsContent>
      <TabsContent value="lms-structure"><LMSStructureManager /></TabsContent>
      <TabsContent value="lms-approvals"><LMSApprovalDashboard /></TabsContent>
      <TabsContent value="subjects"><SubjectManager /></TabsContent>
      <TabsContent value="topics"><TopicManager /></TabsContent>
      <TabsContent value="job-tests"><JobTestManager /></TabsContent>
      <TabsContent value="navigation"><NavigationManager /></TabsContent>
    </Tabs>
  );
};

export default AdminTabs;
