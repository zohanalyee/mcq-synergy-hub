import { useState, useEffect } from "react";
import SEOHead from '@/components/SEOHead';
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookOpen, Shuffle, Target, Clock, HelpCircle, Loader2 } from "lucide-react";
import { LMSSubjectSelector } from "@/components/quizzes/LMSSubjectSelector";
import { LMSTopicSelector } from "@/components/quizzes/LMSTopicSelector";

interface TopicItem {
  id: string;
  name: string;
  description?: string;
}

const Quizzes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
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
  
  // Topics fetched by subject ID for Category B
  const [topicsForSubjectB, setTopicsForSubjectB] = useState<TopicItem[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);

  // Fetch topics when subject B changes
  useEffect(() => {
    setSelectedTopicB("");
    if (!selectedSubjectB) {
      setTopicsForSubjectB([]);
      return;
    }
    const fetchTopics = async () => {
      setTopicsLoading(true);
      const { data, error } = await supabase
        .from('topics')
        .select('id, name, description')
        .eq('subject_id', selectedSubjectB)
        .or('approved.is.null,approved.eq.true')
        .order('name');
      if (!error && data) {
        setTopicsForSubjectB(data as TopicItem[]);
      }
      setTopicsLoading(false);
    };
    fetchTopics();
  }, [selectedSubjectB]);

  // Shared starter: pull MCQs from the bank (DB-only) and create a test session
  const startQuiz = async (opts: {
    subjectId: string;
    topicName?: string;
    questionCount: number;
    timeLimit: number;
    sessionLabel: string;
  }) => {
    if (!user) {
      toast.error("Please sign in to start a quiz");
      return;
    }

    // Resolve subject name (selector returns id only)
    const { data: subjectRow, error: subjErr } = await supabase
      .from('subjects')
      .select('name')
      .eq('id', opts.subjectId)
      .maybeSingle();

    if (subjErr || !subjectRow?.name) {
      toast.error("Could not load subject details. Please try again.");
      return;
    }

    const topicForFetch = opts.topicName || subjectRow.name;

    // 1) Pull questions from the bank (no AI cost)
    const { data: genData, error: genErr } = await supabase.functions.invoke('generate-test', {
      body: {
        topic: topicForFetch,
        difficulty: 'Medium',
        question_count: opts.questionCount,
        fetch_only: true,
        forceNew: false,
        partial_mode: true,
      },
    });

    if (genErr) {
      console.error('generate-test error:', genErr);
      toast.error("Couldn't load questions", {
        description: "Please try a different subject/topic or visit the Question Bank.",
      });
      return;
    }

    const questions = Array.isArray(genData?.questions) ? genData.questions : [];
    if (questions.length === 0) {
      toast.error("No questions available yet", {
        description: `We don't have MCQs for "${topicForFetch}" in the bank. Try another topic or check the Question Bank.`,
      });
      return;
    }

    // 2) Persist a session row so /test-session/:id can render it
    const { data: session, error: sessionErr } = await supabase
      .from('custom_test_sessions')
      .insert({
        user_id: user.id,
        session_name: opts.sessionLabel,
        subjects: [subjectRow.name],
        topics: opts.topicName ? [opts.topicName] : [],
        difficulty_levels: ['Easy', 'Medium', 'Hard'],
        question_count: questions.length,
        time_limit: opts.timeLimit,
        questions,
        is_active: true,
      })
      .select('id')
      .single();

    if (sessionErr || !session?.id) {
      console.error('Session insert error:', sessionErr);
      toast.error("Couldn't start quiz session. Please try again.");
      return;
    }

    navigate(`/test-session/${session.id}`, {
      state: { returnPath: '/quizzes' },
    });
  };

  const handleStartSubjectQuiz = async () => {
    if (!selectedSubjectA) {
      toast.error("Please select a subject");
      return;
    }
    setIsGeneratingA(true);
    try {
      await startQuiz({
        subjectId: selectedSubjectA,
        questionCount: questionCountA,
        timeLimit: timeLimitA,
        sessionLabel: 'Subject Quiz',
      });
    } finally {
      setIsGeneratingA(false);
    }
  };

  const handleStartTopicQuiz = async () => {
    if (!selectedSubjectB || !selectedTopicB) {
      toast.error("Please select both subject and topic");
      return;
    }
    const topicObj = topicsForSubjectB.find(t => t.id === selectedTopicB);
    if (!topicObj) {
      toast.error("Selected topic could not be loaded. Please re-select.");
      return;
    }
    setIsGeneratingB(true);
    try {
      await startQuiz({
        subjectId: selectedSubjectB,
        topicName: topicObj.name,
        questionCount: questionCountB,
        timeLimit: timeLimitB,
        sessionLabel: `Topic Quiz · ${topicObj.name}`,
      });
    } finally {
      setIsGeneratingB(false);
    }
  };

  return (
    <Header>
      <SEOHead
        title="Online Quiz Practice Tests"
        description="Take free online quizzes for MDCAT, ECAT, CSS, PPSC preparation. AI-powered quizzes with instant results and explanations."
        keywords="online quiz, practice test, MCQ quiz, MDCAT quiz, ECAT quiz, free practice"
      />
      <div className="container mx-auto px-4 pt-2 pb-4">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-3 text-center"
        >
          <h1 className="text-xl font-bold text-foreground">Quizzes</h1>
          <p className="text-xs text-muted-foreground">
            Practice with AI-powered quizzes from our Question Bank
          </p>
        </motion.div>

        <Tabs defaultValue="subject" className="mb-2">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-3 h-9">
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
                <CardHeader className="text-center pb-0 pt-3">
                  <div className="mx-auto w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                    <Shuffle className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base">Subject-Wise Quiz</CardTitle>
                  <CardDescription className="text-[11px]">
                    Random questions from any topic under your selected subject
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-3 pt-1">
                  {/* Subject Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="subject-a">Select Subject</Label>
                    <LMSSubjectSelector
                      id="subject-a"
                      value={selectedSubjectA}
                      onValueChange={(id) => setSelectedSubjectA(id)}
                      placeholder="Search & choose a subject..."
                    />
                  </div>
                  
                  {/* Question Count */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-sm">
                        <HelpCircle className="h-3.5 w-3.5" />
                        Questions
                      </Label>
                      <Badge variant="secondary" className="text-xs">{questionCountA}</Badge>
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-sm">
                        <Clock className="h-3.5 w-3.5" />
                        Time Limit
                      </Label>
                      <Badge variant="secondary" className="text-xs">{timeLimitA} min</Badge>
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
                <CardHeader className="text-center pb-0 pt-3">
                  <div className="mx-auto w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center mb-1">
                    <Target className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <CardTitle className="text-base">Topic-Wise Quiz</CardTitle>
                  <CardDescription className="text-[11px]">
                    Focused questions from a specific topic you want to master
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-3 pt-1">
                  {/* Subject Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="subject-b">Select Subject</Label>
                    <LMSSubjectSelector
                      id="subject-b"
                      value={selectedSubjectB}
                      onValueChange={(id) => setSelectedSubjectB(id)}
                      placeholder="Search & choose a subject..."
                    />
                  </div>
                  
                  {/* Topic Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="topic-b">Select Topic</Label>
                    <LMSTopicSelector
                      id="topic-b"
                      topics={topicsForSubjectB}
                      value={selectedTopicB}
                      onValueChange={setSelectedTopicB}
                      disabled={!selectedSubjectB || topicsLoading}
                      placeholder="Search & choose a topic..."
                      disabledPlaceholder={topicsLoading ? "Loading topics..." : "Select a subject first"}
                    />
                    {selectedSubjectB && !topicsLoading && topicsForSubjectB.length === 0 && (
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
          className="mt-4 max-w-2xl mx-auto hidden md:block"
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
