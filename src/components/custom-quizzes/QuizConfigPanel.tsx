
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Slider } from "@/components/ui/slider";
import { CustomSubject, QuizSettings } from "./interfaces";
import SelectedQuizTopics from "./SelectedQuizTopics";
import { Brain, FlaskConical, Clock, Gauge, Zap, Loader2 } from "lucide-react";
import { generateTestFromSyllabus } from "@/services/testGenerationService";

interface QuizConfigPanelProps {
  quizName: string;
  setQuizName: (name: string) => void;
  selectedTopicsCount: number;
  selectedSubjectsCount: number;
  quizSettings: QuizSettings;
  updateQuizSettings: (setting: keyof QuizSettings, value: any) => void;
  customSubjects: CustomSubject[];
  setSelectedCategory: (category: string) => void;
}

const QuizConfigPanel: React.FC<QuizConfigPanelProps> = ({
  quizName,
  setQuizName,
  selectedTopicsCount,
  selectedSubjectsCount,
  quizSettings,
  updateQuizSettings,
  customSubjects,
  setSelectedCategory
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("topics");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const createQuiz = async () => {
    if (selectedTopicsCount === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one topic for your custom quiz.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Build selected topics structure
      const selectedTopics = customSubjects
        .filter(subject => subject.topics.some(topic => topic.selected))
        .flatMap(subject => 
          subject.topics
            .filter(topic => topic.selected)
            .map(topic => ({
              subject: subject.title,
              topic: topic.name
            }))
        );

      // Generate test from question bank
      const generatedTest = await generateTestFromSyllabus(selectedTopics, {
        difficulty: quizSettings.difficulty,
        questionCount: quizSettings.questionsCount,
        timeLimit: quizSettings.timeLimit,
        includeExplanations: true,
        shuffleQuestions: true,
        shuffleOptions: true
      });

      if (!generatedTest) {
        toast({
          title: "No Questions Available",
          description: "No questions found in the Question Bank for the selected topics. Please try different topics or add questions to the bank.",
          variant: "destructive"
        });
        setIsGenerating(false);
        return;
      }

      toast({
        title: "Quiz Generated!",
        description: `Your custom quiz with ${generatedTest.questions.length} questions is ready.`,
      });

      // Navigate to test session with generated test
      navigate('/test-session', { state: { test: generatedTest } });
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast({
        title: "Error",
        description: "Failed to generate quiz. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quiz Configuration</CardTitle>
        <CardDescription>Customize your quiz settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="topics">Topics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="topics" className="mt-4">
            <div>
              <label htmlFor="quiz-name" className="text-sm font-medium mb-1.5 block">Quiz Name</label>
              <Input 
                id="quiz-name"
                value={quizName} 
                onChange={(e) => setQuizName(e.target.value)}
                placeholder="Enter a name for your quiz"
              />
            </div>
            
            <SelectedQuizTopics 
              customSubjects={customSubjects} 
              selectedSubjectsCount={selectedSubjectsCount}
              setSelectedCategory={setSelectedCategory}
            />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-4">
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">Quiz Type</label>
                <Select value={quizSettings.quizType} onValueChange={(value: any) => updateQuizSettings("quizType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select quiz type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="practice">
                      <div className="flex items-center">
                        <Brain className="mr-2 h-4 w-4" />
                        <span>Practice (No time limit)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="timed">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        <span>Timed Quiz</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="challenge">
                      <div className="flex items-center">
                        <FlaskConical className="mr-2 h-4 w-4" />
                        <span>Challenge Mode</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="adaptive">
                      <div className="flex items-center">
                        <Gauge className="mr-2 h-4 w-4" />
                        <span>Adaptive Learning</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {quizSettings.quizType === "practice" && "No time pressure - focus on learning at your own pace"}
                  {quizSettings.quizType === "timed" && "Complete the quiz within the set time limit"}
                  {quizSettings.quizType === "challenge" && "Increasing difficulty with each correct answer"}
                  {quizSettings.quizType === "adaptive" && "Questions adapt to your skill level as you progress"}
                </p>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium">Difficulty Level</label>
                <Select value={quizSettings.difficulty} onValueChange={(value: any) => updateQuizSettings("difficulty", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Number of Questions</label>
                  <span className="text-sm font-medium">{quizSettings.questionsCount}</span>
                </div>
                <Slider
                  min={5}
                  max={50}
                  step={5}
                  value={[quizSettings.questionsCount]}
                  onValueChange={(value) => updateQuizSettings("questionsCount", value[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5</span>
                  <span>50</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Time Limit (minutes)</label>
                  <span className="text-sm font-medium">{quizSettings.timeLimit}</span>
                </div>
                <Slider
                  min={5}
                  max={60}
                  step={5}
                  disabled={quizSettings.quizType === "practice"}
                  value={[quizSettings.timeLimit]}
                  onValueChange={(value) => updateQuizSettings("timeLimit", value[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5</span>
                  <span>60</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button 
          className="w-full" 
          disabled={selectedTopicsCount === 0 || isGenerating}
          onClick={createQuiz}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Quiz...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Create Quiz & Start Test
            </>
          )}
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

export default QuizConfigPanel;
