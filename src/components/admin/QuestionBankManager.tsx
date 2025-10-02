import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { 
  Database, 
  Download, 
  FileQuestion, 
  Search, 
  BarChart3,
  Plus,
  Upload,
  Info,
  Settings
} from "lucide-react";
import { useAdminContent } from "@/hooks/useAdminContent";
import EnhancedContentTable from "@/components/admin/content/EnhancedContentTable";
import QuestionBankTable from "./question-bank/QuestionBankTable";
import BulkUploadDialog from "./question-bank/BulkUploadDialog";
import ManualQuestionDialog from "./question-bank/ManualQuestionDialog";
import { ContentItem } from "@/interfaces/content";
import { insertSampleData } from "@/utils/sampleQuestions";
import QuestionAssignmentDialog from "./question-bank/QuestionAssignmentDialog";

const QuestionBankManager = () => {
  const { getCurrentContent } = useAdminContent();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    easyQuestions: 0,
    mediumQuestions: 0,
    hardQuestions: 0,
    subjectCounts: {} as Record<string, number>
  });

  // Get MCQ content items with 'question_bank' status (awaiting assignment)
  const mcqContent = getCurrentContent().filter(item => 
    item.category === 'mcq' && item.status === 'question_bank'
  );

  useEffect(() => {
    calculateStats();
  }, [mcqContent]);

  const calculateStats = () => {
    const total = mcqContent.length;
    const subjectCounts: Record<string, number> = {};
    
    let easy = 0, medium = 0, hard = 0;
    
    mcqContent.forEach(item => {
      // Count by subject
      if (item.subject) {
        subjectCounts[item.subject] = (subjectCounts[item.subject] || 0) + 1;
      }
      
      // Count by difficulty (if available in content)
      const difficulty = item.difficulty;
      if (difficulty === 'Easy') easy++;
      else if (difficulty === 'Medium') medium++;
      else if (difficulty === 'Hard') hard++;
    });
    
    setStats({
      totalQuestions: total,
      easyQuestions: easy,
      mediumQuestions: medium,
      hardQuestions: hard,
      subjectCounts
    });
  };

  const handleGenerateTest = () => {
    toast.info("Test generation feature will be available soon!");
  };

  const handleExportQuestions = (format: 'pdf' | 'excel' | 'word') => {
    toast.info(`${format.toUpperCase()} export feature will be available soon!`);
  };

  const handleEditClick = (item: ContentItem) => {
    toast.info("Question editing will be available through the main content manager");
  };

  const handleUpdateStatus = (id: string, status: any) => {
    toast.info("Status updates will be available through the main content manager");
  };

  const handleDelete = (id: string) => {
    toast.info("Question deletion will be available through the main content manager");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            Question Bank Manager
          </h2>
          <p className="text-muted-foreground">
            Central repository for all questions - feeds into all tests, syllabus, and job preparation modules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ManualQuestionDialog onQuestionAdded={handleRefresh} />
          <BulkUploadDialog onUploadComplete={handleRefresh} />
          <Button 
            onClick={async () => {
              const success = await insertSampleData();
              if (success) {
                toast.success("Sample data added successfully!");
                handleRefresh();
              } else {
                toast.error("Failed to add sample data");
              }
            }}
            variant="outline"
            size="sm"
          >
            Add Sample Data
          </Button>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Question Bank Workflow:</strong> Questions uploaded to the Question Bank require admin 
          assignment before appearing in practice sections. Use "Assign to Sections" to approve and assign 
          questions to Subject Practice, Custom Syllabus Builder, or Job Test Preparation.
        </AlertDescription>
      </Alert>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalQuestions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Easy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.easyQuestions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Medium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.mediumQuestions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.hardQuestions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">
            <Search className="h-4 w-4 mr-2" />
            Browse Questions
          </TabsTrigger>
          <TabsTrigger value="manage">
            <Settings className="h-4 w-4 mr-2" />
            Manage Questions
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="export">
            <Download className="h-4 w-4 mr-2" />
            Export Tools
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <div className="bg-card rounded-lg border p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Questions Awaiting Assignment</h3>
              <Badge variant="outline" className="px-3 py-1">
                {stats.totalQuestions} Questions
              </Badge>
            </div>
            <QuestionBankTable
              questions={mcqContent}
              onRefresh={handleRefresh}
              onDelete={handleDelete}
            />
          </div>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Add questions to the Question Bank</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <ManualQuestionDialog onQuestionAdded={handleRefresh} />
                  <BulkUploadDialog onUploadComplete={handleRefresh} />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>• Questions added here are immediately available across all modules</p>
                  <p>• Auto-validation ensures data consistency</p>
                  <p>• Subjects/topics are created automatically if missing</p>
                </div>
              </CardContent>
            </Card>

            {/* Integration Status */}
            <Card>
              <CardHeader>
                <CardTitle>Integration Status</CardTitle>
                <CardDescription>Modules using Question Bank</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>Custom Syllabus Builder</span>
                    <Badge variant="default">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>Job Test Preparation</span>
                    <Badge variant="default">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>Subject-wise Practice</span>
                    <Badge variant="default">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>Topic-wise Quizzes</span>
                    <Badge variant="default">Connected</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Question Bank Analytics</CardTitle>
              <CardDescription>
                Overview of question distribution and usage patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Subject Distribution</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(stats.subjectCounts).map(([subject, count]) => (
                      <Badge key={subject} variant="outline" className="justify-between p-2">
                        <span>{subject}</span>
                        <span className="font-semibold">{count}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Difficulty Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Easy Questions</span>
                      <Badge variant="outline" className="bg-green-50">
                        {stats.easyQuestions}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Medium Questions</span>
                      <Badge variant="outline" className="bg-yellow-50">
                        {stats.mediumQuestions}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Hard Questions</span>
                      <Badge variant="outline" className="bg-red-50">
                        {stats.hardQuestions}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Tools</CardTitle>
              <CardDescription>
                Generate and download question packs in various formats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={() => handleExportQuestions('pdf')}
                  variant="outline" 
                  className="h-20 flex-col"
                >
                  <Download className="h-6 w-6 mb-2" />
                  Export as PDF
                </Button>
                
                <Button 
                  onClick={() => handleExportQuestions('excel')}
                  variant="outline" 
                  className="h-20 flex-col"
                >
                  <Download className="h-6 w-6 mb-2" />
                  Export as Excel
                </Button>
                
                <Button 
                  onClick={() => handleExportQuestions('word')}
                  variant="outline" 
                  className="h-20 flex-col"
                >
                  <Download className="h-6 w-6 mb-2" />
                  Export as Word
                </Button>
              </div>
              
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Quick Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Question Pack
                  </Button>
                  <Button size="sm" variant="outline">
                    <FileQuestion className="h-4 w-4 mr-2" />
                    Generate Practice Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuestionBankManager;