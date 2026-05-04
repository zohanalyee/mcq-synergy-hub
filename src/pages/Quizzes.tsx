import { useState, useEffect } from "react";
import SEOHead from '@/components/SEOHead';
import { useNavigate, useLocation } from "react-router-dom";
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
import { BookOpen, Shuffle, Target, Clock, HelpCircle, Loader2, Sparkles } from "lucide-react";
import { LMSSubjectSelector } from "@/components/quizzes/LMSSubjectSelector";
import { LMSTopicSelector } from "@/components/quizzes/LMSTopicSelector";
import { generateSlugUrl } from "@/utils/slugify";
import { saveIntentRaw } from "@/hooks/useAuthIntent";
import PageHeader from "@/components/ui/PageHeader";

interface TopicItem {
  id: string;
  name: string;
  description?: string;
}

const Quizzes = () => {
  const navigate = useNavigate();
  const location = useLocation();
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

  // Direct DB fetch for guests — NO edge function calls.
  // Reads `content_items` via PostgREST under RLS policy
  // "Anyone can view approved content" (status = 'approved').
  const fetchGuestQuestionsFromDB = async (params: {
    subjectId: string;
    subjectName: string;
    topicId?: string;
    topicName?: string;
    questionCount: number;
  }): Promise<any[]> => {
    const fetchLimit = Math.max(params.questionCount * 3, 60);

    let rows: any[] = [];

    if (params.topicId) {
      // TOPIC quiz — strict topic_id scope
      const { data, error } = await supabase
        .from('content_items')
        .select('id, question, options, correct_option, explanation, subject, topic, difficulty')
        .eq('status', 'approved')
        .eq('topic_id', params.topicId)
        .not('question', 'is', null)
        .not('correct_option', 'is', null)
        .limit(fetchLimit);
      if (error) {
        console.error('[Guest Topic Quiz] DB error:', error);
        return [];
      }
      rows = data || [];
    } else {
      // SUBJECT quiz — resolve all topics under this subject, then run
      // SEPARATE PostgREST queries (avoids brittle .or() escaping) and
      // merge + dedupe client-side. Pure DB, no edge fn, no AI.
      const { data: topicRows, error: topicErr } = await supabase
        .from('topics')
        .select('id, name, canonical_name')
        .eq('subject_id', params.subjectId);

      if (topicErr) {
        console.error('[Guest Subject Quiz] topic lookup error:', topicErr);
      }

      const topicIds = (topicRows || []).map((t: any) => t.id).filter(Boolean);
      const canonicalNames = Array.from(new Set(
        (topicRows || [])
          .map((t: any) => t.canonical_name)
          .filter((v: any) => typeof v === 'string' && v.length > 0)
      ));
      const topicNames = Array.from(new Set(
        (topicRows || [])
          .map((t: any) => t.name)
          .filter((v: any) => typeof v === 'string' && v.length > 0)
      ));

      const baseSelect = 'id, question, options, correct_option, explanation, subject, topic, difficulty';
      const seen = new Set<string>();
      const merged: any[] = [];
      const pushRows = (rs: any[] | null | undefined) => {
        if (!rs) return;
        for (const r of rs) {
          if (!r?.id || seen.has(r.id)) continue;
          seen.add(r.id);
          merged.push(r);
        }
      };

      // 1) Match by topic_id (most reliable)
      if (topicIds.length > 0) {
        const { data, error } = await supabase
          .from('content_items')
          .select(baseSelect)
          .eq('status', 'approved')
          .in('topic_id', topicIds)
          .not('question', 'is', null)
          .not('correct_option', 'is', null)
          .limit(fetchLimit);
        if (error) console.error('[Guest Subject Quiz] topic_id query error:', error);
        pushRows(data);
      }

      // 2) Match by canonical_topic_name (for legacy rows without topic_id)
      if (merged.length < fetchLimit && canonicalNames.length > 0) {
        const { data, error } = await supabase
          .from('content_items')
          .select(baseSelect)
          .eq('status', 'approved')
          .in('canonical_topic_name', canonicalNames as string[])
          .not('question', 'is', null)
          .not('correct_option', 'is', null)
          .limit(fetchLimit);
        if (error) console.error('[Guest Subject Quiz] canonical query error:', error);
        pushRows(data);
      }

      // 3) Match by subject name (final fallback for very legacy rows)
      if (merged.length < fetchLimit) {
        const { data, error } = await supabase
          .from('content_items')
          .select(baseSelect)
          .eq('status', 'approved')
          .ilike('subject', params.subjectName)
          .not('question', 'is', null)
          .not('correct_option', 'is', null)
          .limit(fetchLimit);
        if (error) console.error('[Guest Subject Quiz] subject query error:', error);
        pushRows(data);
      }

      // 4) Last-resort: match by topic name (some rows store only topic text)
      if (merged.length < fetchLimit && topicNames.length > 0) {
        const { data, error } = await supabase
          .from('content_items')
          .select(baseSelect)
          .eq('status', 'approved')
          .in('topic', topicNames as string[])
          .not('question', 'is', null)
          .not('correct_option', 'is', null)
          .limit(fetchLimit);
        if (error) console.error('[Guest Subject Quiz] topic-name query error:', error);
        pushRows(data);
      }

      rows = merged;
    }

    if (rows.length === 0) return [];

    // Fisher–Yates shuffle then slice
    const shuffled = [...rows];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, params.questionCount);
  };

  // Shared starter: pull MCQs from the bank (DB-only) and create a test session
  const startQuiz = async (opts: {
    subjectId: string;
    topicId?: string;
    topicName?: string;
    questionCount: number;
    timeLimit: number;
    sessionLabel: string;
  }) => {
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
    const canonicalTopicName = opts.topicName
      ? opts.topicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : undefined;

    let questions: any[] = [];

    if (!user) {
      // GUEST PATH — direct DB query, no edge function, no AI cost.
      questions = await fetchGuestQuestionsFromDB({
        subjectId: opts.subjectId,
        subjectName: subjectRow.name,
        topicId: opts.topicId,
        topicName: opts.topicName,
        questionCount: opts.questionCount,
      });

      if (questions.length === 0) {
        toast.info("No cached questions yet for this selection. Sign in free to generate with AI!", {
          action: {
            label: "Sign In",
            onClick: () => {
              saveIntentRaw({
                action: 'Generate quiz',
                path: location.pathname,
              });
              navigate('/auth');
            },
          },
          duration: 6000,
        });
        return;
      }
    } else {
      // LOGGED-IN PATH — hybrid (DB + AI) via edge function (unchanged behavior).
      const { data: genData, error: genErr } = await supabase.functions.invoke('generate-test', {
        body: {
          topic: topicForFetch,
          difficulty: 'Medium',
          question_count: opts.questionCount,
          fetch_only: false,
          forceNew: false,
          partial_mode: true,
          subject_id: opts.subjectId,
          ...(opts.topicId ? { topic_id: opts.topicId } : {}),
          ...(canonicalTopicName ? { canonical_topic_name: canonicalTopicName } : {}),
        },
      });

      if (genErr) {
        console.error('generate-test error:', genErr);
        toast.error("Couldn't load questions", {
          description: "Please try a different subject/topic or visit the Question Bank.",
        });
        return;
      }

      questions = Array.isArray(genData?.questions) ? genData.questions : [];
      if (questions.length === 0) {
        toast.error("Couldn't load questions", {
          description: "Please try another topic or visit the Question Bank.",
        });
        return;
      }
    }

    // 2) Persist a session row so /quiz-session/:id can render it.
    // Guests can't write to custom_test_sessions (RLS) — store in sessionStorage instead.
    const slugSource = opts.topicName || subjectRow.name;

    if (!user) {
      const guestId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
      const guestSession = {
        id: `guest-${guestId}`,
        session_name: opts.sessionLabel,
        subjects: [subjectRow.name],
        topics: opts.topicName ? [opts.topicName] : [],
        difficulty_levels: ['Easy', 'Medium', 'Hard'],
        question_count: questions.length,
        time_limit: opts.timeLimit,
        questions,
        is_active: true,
      };
      try {
        sessionStorage.setItem(`mcqsai_guest_quiz_${guestSession.id}`, JSON.stringify(guestSession));
      } catch {}
      const slugUrl = generateSlugUrl(slugSource, guestSession.id);
      navigate(`/quiz-session/${slugUrl}`, { state: { returnPath: '/quizzes' } });
      return;
    }

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

    // SEO-friendly slug URL: /quiz-session/<topic-or-subject-slug>-<uuid>
    const slugUrl = generateSlugUrl(slugSource, session.id);

    navigate(`/quiz-session/${slugUrl}`, {
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
        topicId: topicObj.id,
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
      <div className="container mx-auto px-4 pt-6 pb-10">
        <PageHeader
          title="Quizzes"
          icon={HelpCircle}
          colorTheme="violet"
          tagline="Powered by our Question Bank"
          description="Take a focused quiz from a subject or a specific topic — same premium player as Mock Tests, with instant scoring & explanations."
        />

        <Tabs defaultValue="subject" className="mb-2">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6 h-11">
            <TabsTrigger value="subject" className="flex items-center gap-2 text-sm">
              <Shuffle className="h-4 w-4" />
              Subject Quiz
            </TabsTrigger>
            <TabsTrigger value="topic" className="flex items-center gap-2 text-sm">
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
              <Card className="max-w-lg mx-auto overflow-hidden border-2 shadow-xl">
                <div className="h-1.5 bg-gradient-to-r from-primary via-violet-500 to-cyan-500" />
                <CardHeader className="text-center pb-2 pt-5">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center mb-2 ring-1 ring-primary/20">
                    <Shuffle className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Subject-Wise Quiz</CardTitle>
                  <CardDescription className="text-sm">
                    Random questions across all topics in your selected subject
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
              <Card className="max-w-lg mx-auto overflow-hidden border-2 shadow-xl">
                <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-violet-500 to-primary" />
                <CardHeader className="text-center pb-2 pt-5">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-primary/20 flex items-center justify-center mb-2 ring-1 ring-cyan-500/20">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Topic-Wise Quiz</CardTitle>
                  <CardDescription className="text-sm">
                    Master one specific topic — questions stay strictly on-topic
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
