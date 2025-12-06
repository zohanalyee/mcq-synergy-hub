
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
    <Card className="h-fit shadow-sm glass-card">
      <CardHeader className="p-3 pb-2 border-b">
        <CardTitle className="text-sm font-bold text-primary">Quiz Builder</CardTitle>
        <CardDescription className="text-[10px]">Configure your test</CardDescription>
      </CardHeader>
      <CardContent className="p-2 space-y-1.5">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 h-7">
            <TabsTrigger value="topics" className="text-[10px]">Topics</TabsTrigger>
            <TabsTrigger value="settings" className="text-[10px]">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="topics" className="mt-1.5 space-y-1.5">
            <div>
              <label htmlFor="syllabus-name" className="text-[10px] font-medium mb-0.5 block">Name</label>
              <Input 
                id="syllabus-name"
                value={syllabusName} 
                onChange={(e) => setSyllabusName(e.target.value)}
                placeholder="Enter quiz name"
                className="h-7 text-xs"
              />
            </div>
            
            <div>
              <label className="text-[10px] font-medium mb-0.5 block">Categories</label>
              <div className="flex flex-wrap gap-0.5 mb-0.5 max-h-16 overflow-y-auto">
                <Badge 
                  className="cursor-pointer hover:bg-primary/80 text-[10px] px-1.5 py-0" 
                  variant="outline" 
                  onClick={() => setSelectedCategory("All")}
                >
                  All
                </Badge>
                {categories.map((category) => (
                  <Badge 
                    key={category}
                    className="cursor-pointer hover:bg-primary/80 text-[10px] px-1.5 py-0" 
                    variant="outline"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="max-h-24 overflow-y-auto">
              <SelectedTopics 
                customSubjects={customSubjects} 
                selectedSubjectsCount={selectedSubjectsCount}
                setSelectedCategory={setSelectedCategory}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-1.5">
            <QuizSettingsComponent 
              quizSettings={quizSettings}
              updateQuizSettings={updateQuizSettings}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col gap-1.5 p-2 pt-1.5">
        <Button 
          className="w-full h-8 text-xs" 
          disabled={selectedTopicsCount === 0 || isGenerating}
          onClick={createQuiz}
        >
          {isGenerating ? (
            <div className="flex items-center gap-1.5">
              <span className="animate-spin text-xs">◌</span>
              <span>Generating...</span>
            </div>
          ) : (
            'Create Quiz'
          )}
        </Button>
        <Button 
          variant="outline" 
          className="w-full h-7 text-[10px]"
          onClick={() => navigate('/')}
        >
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuizPanel;
