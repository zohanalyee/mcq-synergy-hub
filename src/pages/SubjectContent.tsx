import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import SEOHead from '@/components/SEOHead';
import { motion } from "framer-motion";
import { Book, Sparkles, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { useEffect, useState, ReactNode, useRef } from "react";
import Header from "@/components/Header";
import SubjectHeader from "@/components/subject-content/SubjectHeader";
import TopicsList from "@/components/subject-content/TopicsList";

import ModeToggle, { StudyMode } from "@/components/subject-content/ModeToggle";
import PracticeMCQCard from "@/components/subject-content/PracticeMCQCard";
import MCQControls from "@/components/subject-content/MCQControls";
import { TestGenerationLoader } from "@/components/mock-tests/TestGenerationLoader";
import { Badge } from "@/components/ui/badge";
import { mockTopics } from "@/data/topicsData";
import { supabase } from "@/integrations/supabase/client";
import { getTopicsBySubject } from "@/services/supabaseTopicService";
import { getCachedQuestions, setCachedQuestions } from "@/services/offlineSyncService";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { generateSlugUrl } from "@/utils/slugify";

interface MCQItem {
  id: string;
  title: string;
  question: string;
  options: { key: string; text: string }[];
  correctOption: string;
  explanation?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  topic?: string;
}

interface TopicFromDB {
  id: string;
  name: string;
  description?: string;
}

const SubjectContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [studyMode, setStudyMode] = useState<StudyMode>("practice");
  const [mcqs, setMcqs] = useState<MCQItem[]>([]);
  const [isLoadingMCQs, setIsLoadingMCQs] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("all");
  const [dbTopics, setDbTopics] = useState<TopicFromDB[]>([]);
  const [questionCount, setQuestionCount] = useState<string>("20");
  const [difficulty, setDifficulty] = useState<string>("Medium");
  const [questionSource, setQuestionSource] = useState<'cache' | 'ai' | 'hybrid' | null>(null);
  const [cachedCount, setCachedCount] = useState(0);
  const [aiCount, setAiCount] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Debounce ref to prevent rapid API calls
  const lastFetchTimeRef = useRef<number>(0);
  const DEBOUNCE_MS = 2000; // 2 seconds minimum between calls
  
  
  // Get topic ID from URL query parameter (for deep linking from search)
  const topicIdFromUrl = searchParams.get('topic');
  
  // URL param (route is /subject/:id and /subject-content/:id)
  const { id: routeId } = useParams<{ id: string }>();

  // LMS context — start from router state, hydrate from DB if missing
  const [ctx, setCtx] = useState<{
    title?: string;
    purpose?: string;
    color?: string;
    topicCount?: number;
    subjectId?: string;
    levelId?: string;
    levelName?: string;
    systemId?: string;
    systemName?: string;
  }>(() => location.state || {});

  const { title, purpose, color, topicCount, subjectId, levelId, levelName, systemId, systemName } = ctx;
  const [isHydrating, setIsHydrating] = useState<boolean>(!ctx.title && !!routeId);

  // Normalize the title for lookup in our mock data
  const normalizedTitle = title ? title.toLowerCase() : "";

  // Get topics for this subject (prefer DB topics, fallback to mock)
  const topics = dbTopics.length > 0
    ? dbTopics.map(t => ({ title: t.name, content: t.description || '' }))
    : mockTopics[normalizedTitle] || [];

  const defaultIcon = <Book className="h-6 w-6" style={{ color: color || '#3b82f6' }} />;

  const transformBankQuestion = (q: any, index: number): MCQItem => {
    let options: { key: string; text: string }[] = [];
    if (Array.isArray(q.options)) {
      options = q.options.map((opt: any, i: number) => ({
        key: ['A', 'B', 'C', 'D'][i] || String.fromCharCode(65 + i),
        text: typeof opt === 'string' ? opt : opt?.text || String(opt || '')
      })).filter(opt => opt.text);
    } else if (typeof q.options === 'object' && q.options !== null) {
      options = ['A', 'B', 'C', 'D']
        .filter(key => q.options[key])
        .map(key => ({ key, text: q.options[key] }));
    }

    return {
      id: q.id || `mcq-${index}-${Date.now()}`,
      title: q.question || q.title || '',
      question: q.question || q.title || '',
      options,
      correctOption: q.correct_option || q.correctOption || 'A',
      explanation: q.explanation || undefined,
      difficulty: (q.difficulty as "Easy" | "Medium" | "Hard") || 'Medium',
      topic: q.topic || title,
    };
  };

  const startGuestSubjectQuiz = async () => {
    const requestedCount = Math.min(parseInt(questionCount) || 10, 20);
    setIsLoadingMCQs(true);
    setLoadError(null);
    try {
      const selectedTopicObj = selectedTopicId !== "all"
        ? dbTopics.find(t => t.id === selectedTopicId || t.name === selectedTopic)
        : undefined;
      let query = supabase
        .from('content_items')
        .select('id, title, question, options, correct_option, explanation, difficulty, subject, topic, topic_id')
        .eq('status', 'approved')
        .not('question', 'is', null)
        .limit(Math.max(requestedCount * 3, 40));

      if (selectedTopicObj?.id) {
        query = query.eq('topic_id', selectedTopicObj.id);
      } else if (subjectId) {
        const topicIds = dbTopics.map(t => t.id).filter(Boolean);
        if (topicIds.length > 0) query = query.in('topic_id', topicIds);
        else query = query.ilike('subject', title || '');
      } else {
        query = query.ilike('subject', title || '');
      }

      const { data, error } = await query;
      if (error) throw error;
      const rows = data || [];
      const questions = rows
        .map(transformBankQuestion)
        .filter(q => q && q.question && q.options.length > 0)
        .sort(() => Math.random() - 0.5)
        .slice(0, requestedCount);

      if (rows.length === 0 || questions.length === 0) {
        toast({ title: "No questions available", description: "Please choose another topic or subject." });
        return;
      }

      const guestId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
      const guestSession = {
        id: `guest-${guestId}`,
        session_name: `${title || 'Subject'} Practice`,
        subjects: title ? [title] : [],
        topics: selectedTopicObj?.name ? [selectedTopicObj.name] : [],
        difficulty_levels: ['Easy', 'Medium', 'Hard'],
        question_count: questions.length,
        time_limit: 15,
        questions,
        is_active: true,
      };
      sessionStorage.setItem(`mcqsai_guest_quiz_${guestSession.id}`, JSON.stringify(guestSession));
      navigate(`/quiz-session/${generateSlugUrl(title || 'subject-practice', guestSession.id)}`, {
        state: { returnPath: location.pathname },
      });
    } catch (error: any) {
      console.error('Guest subject quiz error:', error);
      toast({ variant: "destructive", title: "Failed to load questions", description: error?.message || "Please try again." });
    } finally {
      setIsLoadingMCQs(false);
    }
  };

  // Hydrate context from URL :id when state is missing (refresh / deep-link)
  useEffect(() => {
    if (ctx.title || !routeId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('id, name, description, levels(id, name, system_id, educational_systems(id, name))')
          .eq('id', routeId)
          .maybeSingle();
        if (cancelled) return;
        if (error || !data) {
          navigate('/subjects');
          return;
        }
        const lvl: any = (data as any).levels;
        const sys: any = lvl?.educational_systems;
        setCtx({
          title: data.name,
          purpose: (data as any).description || undefined,
          color: '#3b82f6',
          subjectId: data.id,
          levelId: lvl?.id,
          levelName: lvl?.name,
          systemId: sys?.id,
          systemName: sys?.name,
        });
      } catch (e) {
        console.error('Subject hydration failed:', e);
        if (!cancelled) navigate('/subjects');
      } finally {
        if (!cancelled) setIsHydrating(false);
      }
    })();
    return () => { cancelled = true; };
  }, [routeId, ctx.title, navigate]);

  useEffect(() => {
    // Wait for hydration before initializing
    if (!title) return;

    
    setIsLoaded(true);
    loadTopicsFromDB();

    // Cache-first: try offline cache before network
    if (subjectId) {
      const cached = getCachedQuestions(subjectId);
      if (cached && cached.questions.length > 0) {
        // Transform cached questions the same way
        const transformed = cached.questions.map((q: any, index: number) => {
          let options: { key: string; text: string }[] = [];
          if (Array.isArray(q.options)) {
            options = q.options.map((opt: string, i: number) => ({
              key: ['A', 'B', 'C', 'D'][i] || String.fromCharCode(65 + i),
              text: opt
            }));
          } else if (typeof q.options === 'object' && q.options !== null) {
            options = ['A', 'B', 'C', 'D']
              .filter(key => q.options[key])
              .map(key => ({ key, text: q.options[key] }));
          }
          let correctOption = 'A';
          if (q.answer) {
            const matchIndex = options.findIndex(opt => opt.text === q.answer);
            if (matchIndex !== -1) correctOption = options[matchIndex].key;
            else if (['A', 'B', 'C', 'D'].includes(q.answer)) correctOption = q.answer;
          } else if (q.correct_option) {
            correctOption = q.correct_option;
          }
          return {
            id: q.id || `mcq-${index}-${Date.now()}`,
            title: q.question || q.title || '',
            question: q.question || q.title || '',
            options,
            correctOption,
            explanation: q.explanation || undefined,
            difficulty: (q.difficulty as "Easy" | "Medium" | "Hard") || 'Medium',
            topic: q.topic || title,
          };
        });
        setMcqs(transformed);
        setQuestionSource('cache');
        setCachedCount(transformed.length);
        toast({ title: "⚡ Loaded from offline cache", description: `${transformed.length} questions available instantly` });
        return;
      }
    }

    if (!user) return;

    // No cache hit — fetch from DB for logged-in practice mode only
    loadMCQs(false, true);
  }, [title, navigate, subjectId, user]);

  // Auto-select topic from URL query parameter after topics are loaded
  useEffect(() => {
    if (topicIdFromUrl && dbTopics.length > 0) {
      const matchingTopic = dbTopics.find(t => t.id === topicIdFromUrl);
      if (matchingTopic) {
        setSelectedTopicId(topicIdFromUrl);
        setSelectedTopic(matchingTopic.name);
        
        toast({
          title: "📚 Topic Selected",
          description: `Showing MCQs for "${matchingTopic.name}"`,
        });
      }
    }
  }, [topicIdFromUrl, dbTopics]);

  // Load topics from database for this subject
  const loadTopicsFromDB = async () => {
    if (!title) return;
    
    try {
      // If we have a subjectId (LMS subject), use it directly
      if (subjectId) {
        console.log('Loading topics for LMS subject:', subjectId);
        const topics = await getTopicsBySubject(subjectId);
        
        if (topics && topics.length > 0) {
          setDbTopics(topics.map(t => ({
            id: t.id || t.name,
            name: t.name,
            description: t.description
          })));
          return;
        }
      }
      
      // Fallback: Try to find the subject by name in the subjects table
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('id')
        .ilike('name', title)
        .maybeSingle();
      
      if (subjectData?.id) {
        // Get topics linked to this subject
        const { data: topicsData } = await supabase
          .from('topics')
          .select('id, name, description')
          .eq('subject_id', subjectData.id)
          .order('name');
        
        if (topicsData && topicsData.length > 0) {
          setDbTopics(topicsData);
          return;
        }
      }
      
      // Final fallback: Get distinct topics from content_items for this subject
      const { data: mcqTopics } = await supabase
        .from('content_items')
        .select('topic')
        .eq('category', 'mcq')
        .or(`subject.ilike.%${title}%,topic.ilike.%${title}%`)
        .not('topic', 'is', null);
      
      if (mcqTopics) {
        const uniqueTopics = Array.from(new Set(mcqTopics.map(t => t.topic).filter(Boolean)));
        setDbTopics(uniqueTopics.map(name => ({ id: name, name, description: undefined })));
      }
    } catch (error) {
      console.error("Error loading topics:", error);
    }
  };

  // Load MCQs — DB-first with optional AI fallback
  const loadMCQs = async (forceNew = false, fetchOnly = true) => {
    if (!title) return;
    
    // DEBOUNCING: Prevent rapid API calls
    const now = Date.now();
    if (now - lastFetchTimeRef.current < DEBOUNCE_MS) {
      console.log('⏳ Debounced: Too soon since last fetch (wait 2s)');
      return;
    }
    lastFetchTimeRef.current = now;
    
    setIsLoadingMCQs(true);
    setIsGenerating(forceNew && !fetchOnly);
    setLoadError(null);

    const topicToFetch = selectedTopic !== "all" ? selectedTopic : title;
    const requestedCount = parseInt(questionCount);
    
    try {
      console.log('Fetching MCQs:', { 
        topic: topicToFetch, 
        difficulty, 
        question_count: requestedCount,
        forceNew,
        fetchOnly
      });
      
      // Resolve selected topic_id (when a specific topic is chosen) for proper LMS linkage
      const selectedTopicObj = selectedTopicId !== "all"
        ? dbTopics.find(t => t.id === selectedTopicId || t.name === selectedTopic)
        : undefined;
      const canonicalTopicName = (selectedTopicObj?.name || topicToFetch)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const { data, error } = await supabase.functions.invoke('generate-test', {
        body: {
          topic: topicToFetch,
          difficulty: difficulty,
          question_count: requestedCount,
          forceNew: forceNew && !fetchOnly,
          fetch_only: fetchOnly,
          partial_mode: false,
          // LMS linkage so AI-generated MCQs persist into Question Bank correctly
          subject_id: subjectId,
          topic_id: selectedTopicObj?.id,
          canonical_topic_name: canonicalTopicName,
        }
      });

      if (error) {
        console.error('Edge function error:', error);

        // supabase-js throws FunctionsHttpError on non-2xx and stores the Response in error.context
        const res = (error as any)?.context as Response | undefined;
        const status = res?.status;

        // Try to read the function's JSON error payload (e.g. { error, details })
        let serverPayload: any = null;
        try {
          if (res) serverPayload = await res.clone().json();
        } catch {
          // ignore
        }

        const serverMessage =
          serverPayload?.error ||
          serverPayload?.message ||
          (typeof serverPayload === 'string' ? serverPayload : null);

        if (status === 401 || status === 403) {
          throw new Error(
            'Please sign in to load practice questions. If this issue persists, contact the admin.'
          );
        }

        if (status === 402) {
          throw new Error(
            serverMessage ||
              "You've used all your free AI questions for today. Come back tomorrow for more, or keep practicing with our question bank!"
          );
        }

        if (status === 429) {
          throw new Error(serverMessage || 'You are being rate-limited. Please try again in a moment.');
        }

        throw new Error(serverMessage || (error as any)?.message || 'Failed to load questions. Please contact admin if issue persists.');
      }

      if (!data || !data.questions) {
        // Check if data contains an error message (from 402/429 responses)
        if (data?.error) {
          throw new Error(data.error);
        }
        throw new Error('No questions returned from the server');
      }

      console.log('Edge function response:', { 
        source: data.source, 
        questionCount: data.questions.length,
        cachedCount: data.cached_count,
        aiCount: data.ai_count 
      });

      // Transform edge function response to MCQItem format
      const transformedMCQs: MCQItem[] = data.questions.map((q: any, index: number) => {
        // Handle both array options (from AI) and object options (from DB)
        let options: { key: string; text: string }[] = [];
        
        if (Array.isArray(q.options)) {
          // AI format: options is an array of strings
          options = q.options.map((opt: string, i: number) => ({
            key: ['A', 'B', 'C', 'D'][i] || String.fromCharCode(65 + i),
            text: opt
          }));
        } else if (typeof q.options === 'object' && q.options !== null) {
          // DB format: options is an object { A: string, B: string, C: string, D: string }
          options = ['A', 'B', 'C', 'D']
            .filter(key => q.options[key])
            .map(key => ({ key, text: q.options[key] }));
        }

        // Determine correct option key
        let correctOption = 'A';
        if (q.answer) {
          // If answer is the full text, find the matching option
          const matchIndex = options.findIndex(opt => opt.text === q.answer);
          if (matchIndex !== -1) {
            correctOption = options[matchIndex].key;
          } else if (['A', 'B', 'C', 'D'].includes(q.answer)) {
            // If answer is already a key (A, B, C, D)
            correctOption = q.answer;
          }
        } else if (q.correct_option) {
          correctOption = q.correct_option;
        }

        return {
          id: q.id || `mcq-${index}-${Date.now()}`,
          title: q.question || q.title || '',
          question: q.question || q.title || '',
          options,
          correctOption,
          explanation: q.explanation || undefined,
          difficulty: (q.difficulty as "Easy" | "Medium" | "Hard") || (difficulty as "Easy" | "Medium" | "Hard"),
          topic: q.topic || topicToFetch,
        };
      });

      setMcqs(transformedMCQs);
      setQuestionSource(data.source || 'cache');
      setCachedCount(data.cached_count || 0);
      setAiCount(data.ai_count || 0);

      // Update offline cache after successful fetch
      if (subjectId && data.questions.length > 0) {
        setCachedQuestions(subjectId, title, data.questions);
      }
      
      if (data.source === 'ai' || data.ai_count > 0) {
        toast({
          title: data.source === 'ai' ? "🤖 AI Generated Questions" : "🔀 Mixed Source",
          description: data.source === 'ai' 
            ? `Generated ${data.ai_count} new questions and saved to bank`
            : `${data.cached_count} from bank + ${data.ai_count} AI generated`,
        });
      }
      
    } catch (error: any) {
      console.error("Error loading MCQs:", error);

      // If AI credits are depleted (402), retry in DB-only mode to avoid a hard stop.
      const msg = String(error?.message || '').toLowerCase();
      if (msg.includes('credits') || msg.includes('payment required')) {
        try {
          const { data: cacheData, error: cacheErr } = await supabase.functions.invoke('generate-test', {
            body: {
              topic: topicToFetch,
              difficulty: difficulty,
              question_count: requestedCount,
              forceNew: false,
              partial_mode: false,
              fetch_only: true,
            }
          });

          if (!cacheErr && cacheData?.questions) {
            const transformedMCQs: MCQItem[] = cacheData.questions.map((q: any, index: number) => {
              let options: { key: string; text: string }[] = [];

              if (Array.isArray(q.options)) {
                options = q.options.map((opt: string, i: number) => ({
                  key: ['A', 'B', 'C', 'D'][i] || String.fromCharCode(65 + i),
                  text: opt
                }));
              } else if (typeof q.options === 'object' && q.options !== null) {
                options = ['A', 'B', 'C', 'D']
                  .filter(key => q.options[key])
                  .map(key => ({ key, text: q.options[key] }));
              }

              let correctOption = 'A';
              if (q.answer) {
                const matchIndex = options.findIndex(opt => opt.text === q.answer);
                if (matchIndex !== -1) correctOption = options[matchIndex].key;
                else if (['A', 'B', 'C', 'D'].includes(q.answer)) correctOption = q.answer;
              } else if (q.correct_option) {
                correctOption = q.correct_option;
              }

              return {
                id: q.id || `mcq-${index}-${Date.now()}`,
                title: q.question || q.title || '',
                question: q.question || q.title || '',
                options,
                correctOption,
                explanation: q.explanation || undefined,
                difficulty: (q.difficulty as "Easy" | "Medium" | "Hard") || (difficulty as "Easy" | "Medium" | "Hard"),
                topic: q.topic || topicToFetch,
              };
            });

            setMcqs(transformedMCQs);
            setQuestionSource('cache');
            setCachedCount(cacheData.cached_count || transformedMCQs.length);
            setAiCount(0);
            setLoadError(null);

            toast({
              title: 'Daily AI limit reached',
              description: 'Showing practice questions from our question bank.',
            });

            return;
          }
        } catch (e) {
          console.error('Cache-only fallback failed:', e);
        }
      }

      setLoadError(error.message || 'Failed to load questions');
      setMcqs([]);
      
      // Show error toast
      toast({
        variant: "destructive",
        title: "Failed to load questions",
        description: error.message || "Please try again or generate new questions",
      });
    } finally {
      setIsLoadingMCQs(false);
      setIsGenerating(false);
    }
  };

  // Handle generate new questions (Smart Hybrid: bank first → AI fallback)
  const handleGenerateNew = () => {
    loadMCQs(true, false); // forceNew=true, fetchOnly=false → triggers AI if bank is empty
  };

  // Handle refresh (use cache first)
  const handleRefresh = () => {
    loadMCQs(false); // forceNew = false
  };

  // Reload when settings change
  const handleQuestionCountChange = (value: string) => {
    setQuestionCount(value);
  };

  const handleDifficultyChange = (value: string) => {
    setDifficulty(value);
  };

  // Handle topic selection change - update state and refetch questions
  const handleTopicChange = (value: string) => {
    setSelectedTopicId(value);
    if (value === "all") {
      setSelectedTopic("all");
    } else {
      const topic = dbTopics.find(t => t.id === value);
      setSelectedTopic(topic?.name || "all");
    }
  };

  // SMART TOPIC SWITCHING: Check local cache first before API call
  useEffect(() => {
    if (title && isLoaded && selectedTopicId !== "all") {
      // First check if we already have questions for this topic in memory
      const existingForTopic = mcqs.filter(m => m.topic === selectedTopic);
      
      // Only fetch from DB if we have very few cached questions locally
      if (existingForTopic.length < 3) {
        console.log(`📦 Topic "${selectedTopic}" has ${existingForTopic.length} cached, fetching from DB...`);
        loadMCQs(false, true); // fetchOnly = true (DB only, no AI)
      } else {
        console.log(`✅ Topic "${selectedTopic}" has ${existingForTopic.length} cached, using local filter`);
      }
    } else if (title && isLoaded && selectedTopicId === "all") {
      // When switching back to "all", just use client-side filtering
      console.log('📋 Showing all topics from local cache');
    }
  }, [selectedTopicId]);

  // Filter MCQs by selected topic (client-side filtering for already loaded MCQs)
  const filteredMCQs = selectedTopic === "all" 
    ? mcqs 
    : mcqs.filter(m => m.topic === selectedTopic);
  
  return (
    <Header>
      <SEOHead
        title={title ? `${title} MCQs - Practice Questions` : 'Subject Practice'}
        description={title ? `Practice ${title} MCQs with detailed explanations. Free online ${title} quiz for MDCAT, ECAT, and competitive exams.` : undefined}
        keywords={title ? `${title} MCQs, ${title} quiz, ${title} practice, ${title} questions` : undefined}
      />
      {/* Generation Loader Overlay */}
      <TestGenerationLoader 
        isVisible={isGenerating} 
        topicName={selectedTopic !== "all" ? selectedTopic : title} 
      />
      
      <div className="container mx-auto px-4 py-4">
        {/* Breadcrumb Navigation: System > Level > Subject */}
        <PageBreadcrumb 
          items={[
            ...(systemName ? [{
              title: systemName,
              href: `/subjects?system=${encodeURIComponent(systemId || '')}`,
              isCurrent: false
            }] : []),
            ...(levelName ? [{
              title: levelName,
              href: `/subjects?system=${encodeURIComponent(systemId || '')}&level=${encodeURIComponent(levelId || '')}`,
              isCurrent: false
            }] : []),
            {
              title: title || 'Subject',
              href: '#',
              isCurrent: true
            }
          ]}
          showBackButton={true}
          showHomeButton={false}
        />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SubjectHeader 
            title={title || ""}
            purpose={purpose || "reading"}
            color={color || "#3b82f6"}
            icon={defaultIcon}
            topicCount={topicCount || topics.length}
          />
          
          {user && (
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <ModeToggle mode={studyMode} onModeChange={setStudyMode} />
              
              <div className="text-sm text-muted-foreground">
                {studyMode === "read" ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    Correct answers are highlighted for memorization
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary"></span>
                    Click options to reveal Right/Wrong feedback
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* MCQ Controls Panel */}
          <MCQControls
            questionCount={questionCount}
            difficulty={difficulty}
            selectedTopicId={selectedTopicId}
            topics={dbTopics.map(t => ({ id: t.id, name: t.name }))}
            onQuestionCountChange={handleQuestionCountChange}
            onDifficultyChange={handleDifficultyChange}
            onTopicChange={handleTopicChange}
            onRefresh={handleRefresh}
            onGenerate={handleGenerateNew}
            isLoading={isLoadingMCQs}
            isGuest={!user}
            questionSource={questionSource}
            totalQuestions={mcqs.length}
            cachedCount={cachedCount}
            aiCount={aiCount}
          />
          
          {/* Loading State */}
          {isLoadingMCQs && !isGenerating ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Loading questions...</span>
            </div>
          ) : loadError ? (
            /* Error State */
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 mx-auto text-destructive/60 mb-4" />
              <h3 className="text-lg font-medium mb-2">Failed to Load Questions</h3>
              <p className="text-muted-foreground mb-6">{loadError}</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleRefresh}>
                  Try Again
                </Button>
                <Button onClick={handleGenerateNew} className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Generate with AI
                </Button>
              </div>
            </div>
          ) : filteredMCQs.length > 0 ? (
            /* MCQ List */
            <div className="space-y-4">
              {filteredMCQs.map((mcq, index) => (
                <PracticeMCQCard
                  key={mcq.id}
                  id={mcq.id}
                  title={mcq.title}
                  question={mcq.question}
                  options={mcq.options}
                  correctOption={mcq.correctOption}
                  explanation={mcq.explanation}
                  difficulty={mcq.difficulty}
                  mode={studyMode}
                  index={index}
                />
              ))}
            </div>
          ) : (
            /* Empty State with Generate Button */
            <div className="text-center py-12">
              <Book className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium mb-2">No MCQs Available Yet</h3>
              <p className="text-muted-foreground mb-6">
                Generate practice questions using AI for "{selectedTopic !== "all" ? selectedTopic : title}"
              </p>
              <Button onClick={handleGenerateNew} size="lg" className="gap-2">
                <Sparkles className="w-5 h-5" />
                Generate {questionCount} Questions
              </Button>
            </div>
          )}

          {/* Related Practice Section */}
          <div className="mt-12 pt-8 border-t border-border">
            <h2 className="text-lg font-bold mb-4">Continue Practicing</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link to="/mock-tests" className="p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-center">
                <h3 className="font-semibold text-sm">Mock Tests</h3>
                <p className="text-xs text-muted-foreground mt-1">Full-length competitive exam simulations</p>
              </Link>
              <Link to="/custom-syllabus" className="p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-center">
                <h3 className="font-semibold text-sm">Custom Syllabus</h3>
                <p className="text-xs text-muted-foreground mt-1">Build your own test from multiple subjects</p>
              </Link>
              <Link to="/past-papers" className="p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-center">
                <h3 className="font-semibold text-sm">Past Papers</h3>
                <p className="text-xs text-muted-foreground mt-1">Practice with previous exam papers</p>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </Header>
  );
};

export default SubjectContent;
