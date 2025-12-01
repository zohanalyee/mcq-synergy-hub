
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { CustomSubject, QuizSettings } from "./interfaces";
import QuizSettingsComponent from "./QuizSettings";
import SelectedTopics from "./SelectedTopics";
import { Badge } from "@/components/ui/badge";

interface QuizPanelProps {
  syllabusName: string;
  setSyllabusName: (name: string) => void;
  selectedTopicsCount: number;
  selectedSubjectsCount: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  quizSettings: QuizSettings;
  updateQuizSettings: (setting: keyof QuizSettings, value: any) => void;
  createQuiz: () => void;
  customSubjects: CustomSubject[];
  setSelectedCategory: (category: string) => void;
  isGenerating?: boolean;
}

const QuizPanel = ({
  syllabusName,
  setSyllabusName,
  selectedTopicsCount,
  selectedSubjectsCount,
  activeTab,
  setActiveTab,
  quizSettings,
  updateQuizSettings,
  createQuiz,
  customSubjects,
  setSelectedCategory,
  isGenerating = false
}: QuizPanelProps) => {
  const navigate = useNavigate();
  
  // Get unique categories from customSubjects
  const categories = React.useMemo(() => {
    const cats = customSubjects.map(subject => subject.category);
    return Array.from(new Set(cats));
  }, [customSubjects]);

  return (
    <Card className="h-fit sticky top-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Custom Quiz</CardTitle>
        <CardDescription className="text-xs">Configure quiz details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="topics" className="text-xs">Topics</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="topics" className="mt-2 space-y-2">
            <div>
              <label htmlFor="syllabus-name" className="text-xs font-medium mb-1 block">Quiz Name</label>
              <Input 
                id="syllabus-name"
                value={syllabusName} 
                onChange={(e) => setSyllabusName(e.target.value)}
                placeholder="Enter quiz name"
                className="h-8 text-sm"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium mb-1 block">Categories</label>
              <div className="flex flex-wrap gap-1 mb-1 max-h-20 overflow-y-auto">
                <Badge 
                  className="cursor-pointer hover:bg-primary/80 text-xs px-2 py-0.5" 
                  variant="outline" 
                  onClick={() => setSelectedCategory("All")}
                >
                  All
                </Badge>
                {categories.map((category) => (
                  <Badge 
                    key={category}
                    className="cursor-pointer hover:bg-primary/80 text-xs px-2 py-0.5" 
                    variant="outline"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Click to filter subjects
              </p>
            </div>
            
            <div className="max-h-32 overflow-y-auto">
              <SelectedTopics 
                customSubjects={customSubjects} 
                selectedSubjectsCount={selectedSubjectsCount}
                setSelectedCategory={setSelectedCategory}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-2">
            <QuizSettingsComponent 
              quizSettings={quizSettings}
              updateQuizSettings={updateQuizSettings}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-2">
        <Button 
          className="w-full h-8 text-sm" 
          disabled={selectedTopicsCount === 0 || isGenerating}
          onClick={createQuiz}
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <span className="animate-spin">◌</span>
              <span>Generating...</span>
            </div>
          ) : (
            'Create Quiz & Start Test'
          )}
        </Button>
        <Button 
          variant="outline" 
          className="w-full h-8 text-sm"
          onClick={() => navigate('/')}
        >
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuizPanel;
