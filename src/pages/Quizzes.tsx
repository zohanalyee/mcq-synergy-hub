import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { useSupabaseSubjects } from "@/hooks/useSupabaseSubjects";
import { useSupabaseTopics } from "@/hooks/useSupabaseTopics";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookOpen, Shuffle, Target, Clock, HelpCircle, Loader2 } from "lucide-react";

const Quizzes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subjects, loading: subjectsLoading } = useSupabaseSubjects();
  const { allTopics, loading: topicsLoading } = useSupabaseTopics();
  
  // Subject Quiz State (Category A - Random Mix)
  const [selectedSubjectA, setSelectedSubjectA] = useState<string>("");
  const [questionCountA, setQuestionCountA] = useState(10);
  const [timeLimitA, setTimeLimitA] = useState(15);
  const [isGeneratingA, setIsGeneratingA] = useState(false);
  
  // Topic Quiz State (Category B - Specific Focus)
  const [selectedSubjectB, setSelectedSubjectB] = useState<string>("");
  const [selectedTopicB, setSelectedTopicB] = useState<string>("");
  const [questionCountB, setQuestionCountB] = useState(10);
  const [timeLimitB, setTimeLimitB] = useState(15);
  const [isGeneratingB, setIsGeneratingB] = useState(false);
  
  // Get topics for selected subject in Category B
  const availableTopics = selectedSubjectB ? (allTopics[selectedSubjectB] || []) : [];
  
  // Reset topic when subject changes in Category B
  useEffect(() => {
    setSelectedTopicB("");
  }, [selectedSubjectB]);

  const handleStartSubjectQuiz = async () => {
    if (!selectedSubjectA) {
      toast.error("Please select a subject");
      return;
    }
    
    if (!user) {
      toast.error("Please sign in to start a quiz");
      navigate("/auth");
      return;
    }
    
    setIsGeneratingA(true);
    
    try {
      // Call generate-test with subject only (random mix from any topic)
      const { data, error } = await supabase.functions.invoke("generate-test", {
        body: {
          mode: "quiz",
          subject: selectedSubjectA,
          topic: `General ${selectedSubjectA}`, // Broad topic for random mix
          difficulty: "Medium",
          question_count: questionCountA,
          partial_mode: questionCountA > 20,
        },
      });
      
      if (error) throw error;
      
      if (!data?.questions || data.questions.length === 0) {
        toast.error("No questions available for this subject");
        return;
      }
      
      // Create session in database
      const { data: session, error: sessionError } = await supabase
        .from("custom_test_sessions")
        .insert({
          user_id: user.id,
          session_name: `${selectedSubjectA} Quiz`,
          subjects: [selectedSubjectA],
          topics: [],
          difficulty_levels: ["Medium"],
          question_count: data.questions.length,
          time_limit: timeLimitA,
          questions: data.questions,
          is_active: true,
        })
        .select()
        .single();
        
      if (sessionError) throw sessionError;
      
      toast.success(`Starting ${selectedSubjectA} Quiz!`);
      // Pass returnPath for Smart Return feature
      navigate(`/test-session/${session.id}`, { state: { returnPath: '/quizzes' } });
      
    } catch (error) {
      console.error("Error generating subject quiz:", error);
      toast.error("Failed to generate quiz. Please try again.");
    } finally {
      setIsGeneratingA(false);
    }
  };

  const handleStartTopicQuiz = async () => {
    if (!selectedSubjectB || !selectedTopicB) {
      toast.error("Please select both subject and topic");
      return;
    }
    
    if (!user) {
      toast.error("Please sign in to start a quiz");
      navigate("/auth");
      return;
    }
    
    setIsGeneratingB(true);
    
    try {
      // Call generate-test with specific topic (focused questions)
      const { data, error } = await supabase.functions.invoke("generate-test", {
        body: {
          mode: "quiz",
          subject: selectedSubjectB,
          topic: selectedTopicB,
          difficulty: "Medium",
          question_count: questionCountB,
          partial_mode: questionCountB > 20,
        },
      });
      
      if (error) throw error;
      
      if (!data?.questions || data.questions.length === 0) {
        toast.error("No questions available for this topic");
        return;
      }
      
      // Create session in database
      const { data: session, error: sessionError } = await supabase
        .from("custom_test_sessions")
        .insert({
          user_id: user.id,
          session_name: `${selectedTopicB} Quiz`,
          subjects: [selectedSubjectB],
          topics: [selectedTopicB],
          difficulty_levels: ["Medium"],
          question_count: data.questions.length,
          time_limit: timeLimitB,
          questions: data.questions,
          is_active: true,
        })
        .select()
        .single();
        
      if (sessionError) throw sessionError;
      
      toast.success(`Starting ${selectedTopicB} Quiz!`);
      // Pass returnPath for Smart Return feature
      navigate(`/test-session/${session.id}`, { state: { returnPath: '/quizzes' } });
      
    } catch (error) {
      console.error("Error generating topic quiz:", error);
      toast.error("Failed to generate quiz. Please try again.");
    } finally {
      setIsGeneratingB(false);
    }
  };

  const isLoading = subjectsLoading || topicsLoading;

  return (
    <Header>
      <div className="container mx-auto px-4 pt-4 pb-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 text-center"
        >
          <h1 className="text-2xl font-bold text-foreground">Quizzes</h1>
          <p className="text-sm text-muted-foreground">
            Practice with AI-powered quizzes from our Question Bank
          </p>
        </motion.div>

        <Tabs defaultValue="subject" className="mb-4">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6 h-10">
            <TabsTrigger value="subject" className="flex items-center gap-2">
              <Shuffle className="h-4 w-4" />
              Subject Quiz
            </TabsTrigger>
            <TabsTrigger value="topic" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Topic Quiz
            </TabsTrigger>
          </TabsList>
          
          {/* Category A: Subject-Wise Quiz (Random Mix) */}
          <TabsContent value="subject">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="max-w-lg mx-auto">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Shuffle className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Subject-Wise Quiz</CardTitle>
                  <CardDescription>
                    Random questions from any topic under your selected subject
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : (
                    <>
                      {/* Subject Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="subject-a">Select Subject</Label>
                        <Select value={selectedSubjectA} onValueChange={setSelectedSubjectA}>
                          <SelectTrigger id="subject-a">
                            <SelectValue placeholder="Choose a subject..." />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.name}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {subjects.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            No subjects available. Add subjects in Admin Panel.
                          </p>
                        )}
                      </div>
                      
                      {/* Question Count */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2">
                            <HelpCircle className="h-4 w-4" />
                            Questions
                          </Label>
                          <Badge variant="secondary">{questionCountA}</Badge>
                        </div>
                        <Slider
                          value={[questionCountA]}
                          onValueChange={(v) => setQuestionCountA(v[0])}
                          min={5}
                          max={50}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>5</span>
                          <span>50</span>
                        </div>
                      </div>
                      
                      {/* Time Limit */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Time Limit
                          </Label>
                          <Badge variant="secondary">{timeLimitA} min</Badge>
                        </div>
                        <Slider
                          value={[timeLimitA]}
                          onValueChange={(v) => setTimeLimitA(v[0])}
                          min={5}
                          max={60}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>5 min</span>
                          <span>60 min</span>
                        </div>
                      </div>
                      
                      {/* Start Button */}
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handleStartSubjectQuiz}
                        disabled={!selectedSubjectA || isGeneratingA}
                      >
                        {isGeneratingA ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating Quiz...
                          </>
                        ) : (
                          <>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Start Subject Quiz
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          
          {/* Category B: Topic-Wise Quiz (Specific Focus) */}
          <TabsContent value="topic">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="max-w-lg mx-auto">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                    <Target className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <CardTitle>Topic-Wise Quiz</CardTitle>
                  <CardDescription>
                    Focused questions from a specific topic you want to master
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : (
                    <>
                      {/* Subject Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="subject-b">Select Subject</Label>
                        <Select value={selectedSubjectB} onValueChange={setSelectedSubjectB}>
                          <SelectTrigger id="subject-b">
                            <SelectValue placeholder="Choose a subject..." />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.name}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Topic Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="topic-b">Select Topic</Label>
                        <Select 
                          value={selectedTopicB} 
                          onValueChange={setSelectedTopicB}
                          disabled={!selectedSubjectB}
                        >
                          <SelectTrigger id="topic-b">
                            <SelectValue placeholder={
                              selectedSubjectB 
                                ? "Choose a topic..." 
                                : "Select a subject first"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTopics.map((topic) => (
                              <SelectItem key={topic.id} value={topic.name}>
                                {topic.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedSubjectB && availableTopics.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            No topics available for this subject.
                          </p>
                        )}
                      </div>
                      
                      {/* Question Count */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2">
                            <HelpCircle className="h-4 w-4" />
                            Questions
                          </Label>
                          <Badge variant="secondary">{questionCountB}</Badge>
                        </div>
                        <Slider
                          value={[questionCountB]}
                          onValueChange={(v) => setQuestionCountB(v[0])}
                          min={5}
                          max={50}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>5</span>
                          <span>50</span>
                        </div>
                      </div>
                      
                      {/* Time Limit */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Time Limit
                          </Label>
                          <Badge variant="secondary">{timeLimitB} min</Badge>
                        </div>
                        <Slider
                          value={[timeLimitB]}
                          onValueChange={(v) => setTimeLimitB(v[0])}
                          min={5}
                          max={60}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>5 min</span>
                          <span>60 min</span>
                        </div>
                      </div>
                      
                      {/* Start Button */}
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handleStartTopicQuiz}
                        disabled={!selectedSubjectB || !selectedTopicB || isGeneratingB}
                      >
                        {isGeneratingB ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating Quiz...
                          </>
                        ) : (
                          <>
                            <Target className="mr-2 h-4 w-4" />
                            Start Topic Quiz
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
        
        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 max-w-2xl mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Shuffle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Subject Quiz</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Get a random mix of questions from all topics within a subject. 
                      Great for comprehensive revision.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Topic Quiz</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Focus on a specific topic to master it. 
                      Questions are strictly related to your chosen topic.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </Header>
  );
};

export default Quizzes;
