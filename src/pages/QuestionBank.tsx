import { useState, useEffect } from "react";
import SEOHead from '@/components/SEOHead';
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Database, 
  BarChart3, 
  Download, 
  Play,
  Plus,
  Settings
} from "lucide-react";
import { QuestionBankFilters } from "@/components/question-bank/QuestionBankFilters";
import { QuestionBankTable } from "@/components/question-bank/QuestionBankTable";
import { 
  getQuestionBank, 
  getQuestionStats, 
  QuestionFilters, 
  QuestionBankItem 
} from "@/services/questionBankService";
import { generateCustomTest } from "@/services/testGenerationService";
import { exportQuestions, getRoleBasedExportOptions } from "@/services/exportService";
import { toast } from "sonner";

const QuestionBank = () => {
  const [activeTab, setActiveTab] = useState("bank");
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  // BrandingLoader is used via QuestionBankTable's loading prop
  const [filters, setFilters] = useState<QuestionFilters>({});
  const [stats, setStats] = useState<any>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionBankItem | null>(null);

  const breadcrumbItems = [
    { title: "AI Personal Coach", href: "/analytics" },
    { title: "Question Bank", href: "/question-bank", isCurrent: true }
  ];

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { getSubjectsWithQuestions } = await import('@/services/questionUploadService');
      
      const [questionsData, statsData, validSubjects] = await Promise.all([
        getQuestionBank(filters),
        getQuestionStats(),
        getSubjectsWithQuestions()
      ]);
      
      // Show all approved MCQs that have either subject OR topic
      const validQuestions = questionsData.filter(q => q.subject || q.topic);
      
      setQuestions(validQuestions);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading question bank data:", error);
      toast.error("Failed to load question bank");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadData();
  };

  const handleQuestionSelect = (question: QuestionBankItem) => {
    setSelectedQuestion(question);
    // Could open a modal or navigate to detail view
  };

  const handleBulkExport = async (selectedQuestions: QuestionBankItem[]) => {
    try {
      const exportOptions = getRoleBasedExportOptions('teacher'); // Default to teacher
      const url = await exportQuestions({
        questions: selectedQuestions,
        options: {
          format: 'pdf',
          type: 'questions',
          includeAnswers: exportOptions.includeAnswers || true,
          includeExplanations: exportOptions.includeExplanations || true,
          includeImages: true,
          roleBasedAccess: 'teacher'
        },
        fileName: `question-bank-export-${new Date().toISOString().split('T')[0]}`
      });

      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = `question-bank-export-${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();
        toast.success("Export completed successfully");
      } else {
        toast.error("Export failed");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed");
    }
  };

  const handleGenerateTest = async (selectedQuestions: QuestionBankItem[]) => {
    try {
      const subjects = [...new Set(selectedQuestions.map(q => q.subject))];
      const topics = [...new Set(selectedQuestions.map(q => q.topic))];

      const test = await generateCustomTest({
        subjects,
        topics,
        difficulty: 'mixed',
        questionCount: Math.min(selectedQuestions.length, 20),
        timeLimit: 30,
        includeExplanations: true,
        shuffleQuestions: true,
        shuffleOptions: false
      });

      if (test) {
        toast.success(`Generated test with ${test.questions.length} questions`);
        // Navigate to test or open in modal
      } else {
        toast.error("Failed to generate test");
      }
    } catch (error) {
      console.error("Test generation error:", error);
      toast.error("Test generation failed");
    }
  };

  return (
    <Header>
      <div className="container mx-auto px-4 pt-8 pb-16">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between text-center md:text-left">
            <div className="w-full md:w-auto">
              <h1 className="text-3xl font-bold text-foreground">Question Bank</h1>
              <p className="text-muted-foreground">
                Centralized repository for all MCQ questions with smart filtering and test generation
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Questions
              </Button>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalQuestions}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Featured</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.featuredCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Subjects</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.keys(stats.bySubject).length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Most Used</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.mostUsed[0]?.usage_count || 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="bank">Question Bank</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="exports">Export History</TabsTrigger>
            </TabsList>

            <TabsContent value="bank" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Filters */}
                <div className="lg:col-span-1">
                  <QuestionBankFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    onSearch={handleSearch}
                  />
                </div>

                {/* Question Table */}
                <div className="lg:col-span-3">
                  <QuestionBankTable
                    questions={questions}
                    loading={loading}
                    onQuestionSelect={handleQuestionSelect}
                    onBulkExport={handleBulkExport}
                    onGenerateTest={handleGenerateTest}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Question Bank Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Questions by Subject</h3>
                        <div className="space-y-2">
                          {Object.entries(stats.bySubject).map(([subject, count]) => (
                            <div key={subject} className="flex justify-between">
                              <span>{subject}</span>
                              <span className="font-medium">{count as number}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2">Questions by Difficulty</h3>
                        <div className="space-y-2">
                          {Object.entries(stats.byDifficulty).map(([difficulty, count]) => (
                            <div key={difficulty} className="flex justify-between">
                              <span>{difficulty}</span>
                              <span className="font-medium">{count as number}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="exports">
              <Card>
                <CardHeader>
                  <CardTitle>Export History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Export history will show recent downloads and generated files.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Header>
  );
};

export default QuestionBank;