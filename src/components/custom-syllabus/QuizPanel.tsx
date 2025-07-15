
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
  setSelectedCategory
}: QuizPanelProps) => {
  const navigate = useNavigate();
  
  // Get unique categories from customSubjects
  const categories = React.useMemo(() => {
    const cats = customSubjects.map(subject => subject.category);
    return Array.from(new Set(cats));
  }, [customSubjects]);

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Custom Quiz</CardTitle>
        <CardDescription className="text-sm">Configure quiz details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="topics">Topics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="topics" className="mt-4">
            <div>
              <label htmlFor="syllabus-name" className="text-sm font-medium mb-1.5 block">Quiz Name</label>
              <Input 
                id="syllabus-name"
                value={syllabusName} 
                onChange={(e) => setSyllabusName(e.target.value)}
                placeholder="Enter a name for your quiz"
              />
            </div>
            
            <div className="mt-4">
              <label className="text-sm font-medium mb-1.5 block">Quiz Categories</label>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge 
                  className="cursor-pointer hover:bg-primary/80" 
                  variant="outline" 
                  onClick={() => setSelectedCategory("All")}
                >
                  All
                </Badge>
                {categories.map((category) => (
                  <Badge 
                    key={category}
                    className="cursor-pointer hover:bg-primary/80" 
                    variant="outline"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Click on a category to filter subjects. Each category serves a different quiz function.
              </p>
            </div>
            
            <SelectedTopics 
              customSubjects={customSubjects} 
              selectedSubjectsCount={selectedSubjectsCount}
              setSelectedCategory={setSelectedCategory}
            />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-4">
            <QuizSettingsComponent 
              quizSettings={quizSettings}
              updateQuizSettings={updateQuizSettings}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button 
          className="w-full" 
          disabled={selectedTopicsCount === 0}
          onClick={createQuiz}
        >
          Create Quiz & Start Test
        </Button>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate('/')}
        >
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuizPanel;
