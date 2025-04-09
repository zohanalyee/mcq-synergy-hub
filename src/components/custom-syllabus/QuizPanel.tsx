
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Custom Quiz</CardTitle>
        <CardDescription>Configure your quiz details</CardDescription>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="topics">Topics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-6">
        <TabsContent value="topics" className="mt-0">
          <div>
            <label htmlFor="syllabus-name" className="text-sm font-medium mb-1.5 block">Quiz Name</label>
            <Input 
              id="syllabus-name"
              value={syllabusName} 
              onChange={(e) => setSyllabusName(e.target.value)}
              placeholder="Enter a name for your quiz"
            />
          </div>
          
          <SelectedTopics 
            customSubjects={customSubjects} 
            selectedSubjectsCount={selectedSubjectsCount}
            setSelectedCategory={setSelectedCategory}
          />
        </TabsContent>
        
        <TabsContent value="settings" className="mt-0">
          <QuizSettingsComponent 
            quizSettings={quizSettings}
            updateQuizSettings={updateQuizSettings}
          />
        </TabsContent>
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
