import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Database, 
  Download, 
  FileQuestion, 
  Search, 
  BarChart3,
  Plus,
  Info,
  Settings,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import QuestionBankTable from "./question-bank/QuestionBankTable";
import BulkUploadDialog from "./question-bank/BulkUploadDialog";
import ManualQuestionDialog from "./question-bank/ManualQuestionDialog";
import { ContentItem } from "@/interfaces/content";
import { insertSampleData } from "@/utils/sampleQuestions";

const ITEMS_PER_PAGE = 20;

const QuestionBankManager = () => {
  const [questions, setQuestions] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Stats state - fetched from database
  const [stats, setStats] = useState({
    totalQuestions: 0,
    easyQuestions: 0,
    mediumQuestions: 0,
    hardQuestions: 0,
    mixQuestions: 0
  });

  // Map database row to ContentItem interface
  const mapDbRowToContentItem = (row: any): ContentItem => ({
    id: row.id,
    title: row.title,
    description: row.description || '',
    category: row.category,
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    createdBy: row.created_by || '',
    imageUrl: row.image_url,
    fileUrl: row.file_url,
    deadline: row.deadline,
    department: row.department,
    governmentLevel: row.government_level,
    cadre: row.cadre,
    scholarshipType: row.scholarship_type,
    institution: row.institution,
    examType: row.exam_type,
    examYear: row.exam_year,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    metaKeywords: row.meta_keywords,
    subject: row.subject,
    topic: row.topic,
    difficulty: row.difficulty,
    explanation: row.explanation,
    options: row.options,
    correctOption: row.correct_option,
    timeLimit: row.time_limit,
    marks: row.marks,
    questions: row.questions,
    showInSubjects: row.show_in_subjects,
    showInSyllabus: row.show_in_syllabus,
    showInMockTests: row.show_in_mock_tests,
  });

  // Fetch questions with server-side pagination
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      // Build the base query for count
      let countQuery = supabase
        .from('content_items')
        .select('*', { count: 'exact', head: true });

      // Apply category filter
      if (categoryFilter === "all") {
        countQuery = countQuery.in('category', ['mcq', 'quiz']);
      } else {
        countQuery = countQuery.eq('category', categoryFilter);
      }

      // Apply search filter
      if (searchQuery.trim()) {
        countQuery = countQuery.or(`title.ilike.%${searchQuery}%,topic.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%`);
      }

      // Get total count
      const { count } = await countQuery;
      setTotalCount(count || 0);

      // Fetch paginated data with sorting (newest first)
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let dataQuery = supabase
        .from('content_items')
        .select('*');

      // Apply same filters
      if (categoryFilter === "all") {
        dataQuery = dataQuery.in('category', ['mcq', 'quiz']);
      } else {
        dataQuery = dataQuery.eq('category', categoryFilter);
      }

      if (searchQuery.trim()) {
        dataQuery = dataQuery.or(`title.ilike.%${searchQuery}%,topic.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%`);
      }

      // Apply sorting (newest first) and pagination
      const { data, error } = await dataQuery
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Error fetching questions:', error);
        toast.error('Failed to fetch questions');
        return;
      }

      setQuestions((data || []).map(mapDbRowToContentItem));
    } catch (error) {
      console.error('Error in fetchQuestions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch total stats from database (independent of pagination)
  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('content_items')
        .select('difficulty')
        .in('category', ['mcq', 'quiz']);
      
      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }
      
      let easy = 0, medium = 0, hard = 0, mix = 0;
      
      (data || []).forEach(item => {
        const d = item.difficulty?.toLowerCase()?.trim();
        
        if (!d || d === '' || d === 'mix' || d === 'mixed' || d.includes(',')) {
          mix++;
        } else if (d === 'easy') {
          easy++;
        } else if (d === 'medium') {
          medium++;
        } else if (d === 'hard') {
          hard++;
        } else {
          // Any other value counts as Mix
          mix++;
        }
      });
      
      setStats({
        totalQuestions: data?.length || 0,
        easyQuestions: easy,
        mediumQuestions: medium,
        hardQuestions: hard,
        mixQuestions: mix
      });
    } catch (error) {
      console.error('Error in fetchStats:', error);
    }
  };

  // Fetch on mount and when filters/page change
  useEffect(() => {
    fetchQuestions();
  }, [currentPage, categoryFilter]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  // Reset to page 1 when search changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchQuestions();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleExportQuestions = (format: 'pdf' | 'excel' | 'word') => {
    toast.info(`${format.toUpperCase()} export feature will be available soon!`);
  };

  const handleDelete = (id: string) => {
    toast.info("Question deletion will be available through the main content manager");
  };

  const handleRefresh = () => {
    fetchQuestions();
    fetchStats();
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.mixQuestions}</div>
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
            {/* Search & Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, topic, or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="mcq">MCQ</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="job">Job</SelectItem>
                  <SelectItem value="past_paper">Past Paper</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Questions (Newest First)</h3>
              <Badge variant="outline" className="px-3 py-1">
                {totalCount} Total Questions
              </Badge>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading questions...</span>
              </div>
            ) : (
              <>
                <QuestionBankTable
                  questions={questions}
                  onRefresh={handleRefresh}
                  onDelete={handleDelete}
                />

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
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
                  <h4 className="font-medium mb-2">Difficulty Distribution (Total Database)</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Easy Questions</span>
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-900/30">
                        {stats.easyQuestions}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Medium Questions</span>
                      <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/30">
                        {stats.mediumQuestions}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Hard Questions</span>
                      <Badge variant="outline" className="bg-red-50 dark:bg-red-900/30">
                        {stats.hardQuestions}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Mix Questions</span>
                      <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/30">
                        {stats.mixQuestions}
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
