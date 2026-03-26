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
  Sparkles, Zap, Navigation, Settings, Brain, Cpu, Mail, Star, Music,
  PenSquare, HelpCircle,
} from "lucide-react";
import { Share2 } from "lucide-react";
import AutoFillDashboard from "./auto-fill/AutoFillDashboard";
import DocumentMCQConverter from "./DocumentMCQConverter";
import NavigationManager from "./NavigationManager";
import BlogManager from "./BlogManager";
import FAQManager from "./FAQManager";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import AdminMessagesPanel from "./messages/AdminMessagesPanel";
import AdminFeedbackPanel from "./feedback/AdminFeedbackPanel";
import StudySoundsManager from "./StudySoundsManager";
import SocialLinksManager from "./SocialLinksManager";

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
  glowColor: string;
  items: TabItem[];
  extra?: React.ReactNode;
}

const AdminTabs = ({ activeTab, setActiveTab }: AdminTabsProps) => {
  const groups: TabGroup[] = [
    {
      label: "Overview",
      colorClass: "hover:bg-cyan-500/10 dark:hover:bg-cyan-500/10",
      activeColorClass: "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]",
      iconColorClass: "text-cyan-400",
      glowColor: "from-cyan-500/20",
      items: [
        { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { value: "analytics", label: "Analytics", icon: BarChart3 },
        { value: "inventory", label: "Inventory", icon: Archive },
      ],
    },
    {
      label: "Content",
      colorClass: "hover:bg-emerald-500/10 dark:hover:bg-emerald-500/10",
      activeColorClass: "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
      iconColorClass: "text-emerald-400",
      glowColor: "from-emerald-500/20",
      items: [
        { value: "question-bank", label: "Question Bank", icon: Database },
        { value: "review-duplicates", label: "Review Duplicates", icon: AlertTriangle },
        { value: "submit-content", label: "Submit", icon: FileText },
        { value: "bulk-upload", label: "Bulk Upload", icon: Upload },
        { value: "blog-manager", label: "Blog", icon: PenSquare },
        { value: "faq-manager", label: "FAQ", icon: HelpCircle },
      ],
    },
    {
      label: "AI & Generation",
      colorClass: "hover:bg-violet-500/10 dark:hover:bg-violet-500/10",
      activeColorClass: "bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border border-violet-500/30 shadow-[0_0_12px_rgba(139,92,246,0.2)]",
      iconColorClass: "text-violet-400",
      glowColor: "from-violet-500/20",
      items: [
        { value: "generate-mcqs", label: "Generate MCQs", icon: Sparkles },
        { value: "smart-generation", label: "Smart Generation", icon: Zap },
        { value: "doc-to-mcq", label: "Doc → MCQ", icon: Cpu },
        { value: "documents", label: "Documents", icon: Library },
      ],
    },
    {
      label: "External",
      colorClass: "hover:bg-amber-500/10 dark:hover:bg-amber-500/10",
      activeColorClass: "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]",
      iconColorClass: "text-amber-400",
      glowColor: "from-amber-500/20",
      items: [
        { value: "jobs", label: "Jobs", icon: BriefcaseBusiness },
        { value: "scholarships", label: "Scholarships", icon: GraduationCap },
      ],
      extra: (
        <Link to="/admin/curation">
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-amber-400/70 hover:bg-amber-500/10 hover:text-amber-300">
            <Globe className="h-3.5 w-3.5" />
            External Curation
          </button>
        </Link>
      ),
    },
    {
      label: "Structure",
      colorClass: "hover:bg-slate-400/10 dark:hover:bg-slate-400/10",
      activeColorClass: "bg-gradient-to-r from-slate-400/20 to-zinc-400/20 text-slate-300 border border-slate-400/30 shadow-[0_0_12px_rgba(148,163,184,0.1)]",
      iconColorClass: "text-slate-400",
      glowColor: "from-slate-400/20",
      items: [
        { value: "lms-structure", label: "LMS Structure", icon: Layers },
        { value: "lms-approvals", label: "LMS Approvals", icon: ShieldCheck },
        { value: "subjects", label: "Subjects", icon: BookOpen },
        { value: "topics", label: "Topics", icon: FolderTree },
        { value: "job-tests", label: "Job Tests", icon: Briefcase },
        { value: "navigation", label: "Navigation", icon: Navigation },
        { value: "study-sounds", label: "Study Sounds", icon: Music },
        { value: "messages", label: "Messages", icon: Mail },
        { value: "feedback-analytics", label: "Feedback", icon: Star },
        { value: "social-links", label: "Social Links", icon: Share2 },
      ],
    },
  ];

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      {/* AI-Powered Grouped Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-4 space-y-1.5 rounded-2xl border border-violet-500/15 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-violet-950/30 dark:from-slate-950 dark:via-slate-950/95 dark:to-violet-950/20 backdrop-blur-xl p-3 shadow-xl shadow-violet-500/5"
      >
        {/* Subtle scan line effect */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,92,246,0.1) 2px, rgba(139,92,246,0.1) 4px)`
        }} />

        {groups.map((group, groupIndex) => (
          <motion.div
            key={group.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: groupIndex * 0.05 }}
          >
            <div className="flex items-center gap-2 mb-1 px-1">
              <div className={cn("w-1 h-3 rounded-full bg-gradient-to-b", group.glowColor, "to-transparent")} />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                {group.label}
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.value;
                return (
                  <motion.button
                    key={item.value}
                    onClick={() => setActiveTab(item.value)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                      isActive
                        ? group.activeColorClass
                        : cn("text-slate-400 border border-transparent", group.colorClass)
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", isActive ? "" : group.iconColorClass)} />
                    {item.label}
                  </motion.button>
                );
              })}
              {group.extra}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Dashboard Tab */}
      <TabsContent value="dashboard">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <AIContentFactory />
          <Card className="border-cyan-500/10 bg-gradient-to-br from-card to-cyan-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-5 w-5 text-cyan-400" />
                Question Bank
              </CardTitle>
              <CardDescription className="text-xs">Manage all questions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setActiveTab("question-bank")} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-0" size="sm">
                Open Question Bank
              </Button>
            </CardContent>
          </Card>
          <Card className="border-violet-500/10 bg-gradient-to-br from-card to-violet-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-violet-400" />
                Content Management
              </CardTitle>
              <CardDescription className="text-xs">Submit and upload content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" onClick={() => setActiveTab("submit-content")} className="w-full border-violet-500/20 hover:bg-violet-500/10" size="sm">
                Submit Content
              </Button>
              <Button variant="outline" onClick={() => setActiveTab("bulk-upload")} className="w-full border-violet-500/20 hover:bg-violet-500/10" size="sm">
                Bulk Upload
              </Button>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/10 bg-gradient-to-br from-card to-emerald-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-5 w-5 text-emerald-400" />
                Configuration
              </CardTitle>
              <CardDescription className="text-xs">Manage subjects, topics & tests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" onClick={() => setActiveTab("subjects")} className="w-full border-emerald-500/20 hover:bg-emerald-500/10" size="sm">
                Subjects
              </Button>
              <Button variant="outline" onClick={() => setActiveTab("topics")} className="w-full border-emerald-500/20 hover:bg-emerald-500/10" size="sm">
                Topics
              </Button>
              <Button variant="outline" onClick={() => setActiveTab("job-tests")} className="w-full border-emerald-500/20 hover:bg-emerald-500/10" size="sm">
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
      <TabsContent value="study-sounds"><StudySoundsManager /></TabsContent>
      <TabsContent value="messages"><AdminMessagesPanel /></TabsContent>
      <TabsContent value="feedback-analytics"><AdminFeedbackPanel /></TabsContent>
      <TabsContent value="blog-manager"><BlogManager /></TabsContent>
      <TabsContent value="faq-manager"><FAQManager /></TabsContent>
    </Tabs>
  );
};

export default AdminTabs;
