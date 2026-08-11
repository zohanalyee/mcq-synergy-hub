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
import GuestTopicsGate from "@/components/subject-content/GuestTopicsGate";

import ModeToggle, { StudyMode } from "@/components/subject-content/ModeToggle";
import PracticeMCQCard from "@/components/subject-content/PracticeMCQCard";
import MCQControls from "@/components/subject-content/MCQControls";
import { TestGenerationLoader } from "@/components/mock-tests/TestGenerationLoader";
import { Badge } from "@/components/ui/badge";
import { mockTopics } from "@/data/topicsData";
import { supabase } from "@/integrations/supabase/client";
import { getTopicsBySubject } from "@/services/supabaseTopicService";
import { getCachedQuestions, setCachedQuestions } from "@/services/offlineSyncService";
import { loadGuestQuestions } from "@/services/guestQuestionService";
import { buildGuestSession, saveGuestSession } from "@/lib/guestSession";
import { prefetchPracticeAnswers, type ScoredAnswer } from "@/services/practiceScoringService";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthIntent } from "@/hooks/useAuthIntent";
import { generateSlugUrl } from "@/utils/slugify";
import { findBestMatch } from "@/lib/slugUtils";

import { processTestCompletion } from "@/utils/gamification";
import ResultAdviceCard from "@/components/shared/ResultAdviceCard";

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
  const { user } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  // True when the :id in the URL matches no subject — renders a real 404 + noindex.
  const [notFound, setNotFound] = useState(false);

  const [studyMode, setStudyMode] = useState<StudyMode>("practice");
  const [mcqs, setMcqs] = useState<MCQItem[]>([]);
  // Batch-prefetched answer keys for the guest flow (id -> ScoredAnswer).
  const [prefetchedAnswers, setPrefetchedAnswers] = useState<Record<string, ScoredAnswer>>({});
  const [isLoadingMCQs, setIsLoadingMCQs] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("all");
  const [dbTopics, setDbTopics] = useState<TopicFromDB[]>([]);
  const [questionCount, setQuestionCount] = useState<string>("20");
  const [difficulty, setDifficulty] = useState<string>("mix");
  const [questionSource, setQuestionSource] = useState<'cache' | 'ai' | 'hybrid' | null>(null);
  const [cachedCount, setCachedCount] = useState(0);
  const [aiCount, setAiCount] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Debounce ref to prevent rapid API calls
  const lastFetchTimeRef = useRef<number>(0);
  const DEBOUNCE_MS = 2000; // 2 seconds minimum between calls
  
  
  // Get topic ID from URL query parameter (for deep linking from search)
  const topicIdFromUrl = searchParams.get('topic');
  // Query-param runner variants (?topic=…&count=…&timed=true) are infinite
  // duplicates of the clean subject URL. Keep only the bare URL indexable.
  const isRunnerVariant = searchParams.toString().length > 0;
  
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

  // Resolve a correct-answer value (could be a letter key OR full option text) to an A/B/C/D key.
  const resolveCorrectKey = (
    options: { key: string; text: string }[],
    raw: any
  ): string => {
    const r = (raw == null ? '' : String(raw)).trim();
    if (!r) return options[0]?.key || 'A';
    const upper = r.toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(upper)) return upper;
    const lower = r.toLowerCase();
    const match = options.find(
      o => o.text === r || (o.text && o.text.toLowerCase() === lower)
    );
    return match?.key || options[0]?.key || 'A';
  };

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
      correctOption: resolveCorrectKey(options, q.correct_option ?? q.correctOption ?? q.answer),
      explanation: q.explanation || undefined,
      difficulty: (q.difficulty as "Easy" | "Medium" | "Hard") || 'Medium',
      topic: q.topic || title,
    };
  };

  // Guest gate dialog state
  const [guestGateOpen, setGuestGateOpen] = useState(false);
  // Has the guest unlocked the in-page integrated player by clicking the free topic?
  const [guestStarted, setGuestStarted] = useState(false);
  // Which topic id the guest is allowed to play (the first/free one)
  const [guestAllowedTopicId, setGuestAllowedTopicId] = useState<string | null>(null);
  const [showGeneratePrompt, setShowGeneratePrompt] = useState(false);

  const { saveIntent } = useAuthIntent();

  const openGuestGate = () => {
    saveIntent({
      action: "unlock_subject",
      path: location.pathname + location.search,
    });
    setGuestGateOpen(true);
  };

  const startGuestSubjectQuiz = async (overrideTopic?: { id?: string; name: string }) => {
    const requestedCount = Math.min(parseInt(questionCount) || 10, 20);
    setIsLoadingMCQs(true);
    setLoadError(null);
    try {
      const selectedTopicObj = overrideTopic
        ? dbTopics.find(t => t.id === overrideTopic.id || t.name === overrideTopic.name) || { id: overrideTopic.id, name: overrideTopic.name } as TopicFromDB
        : selectedTopicId !== "all"
          ? dbTopics.find(t => t.id === selectedTopicId || t.name === selectedTopic)
          : undefined;

      const { rows, questions, broadened } = await loadGuestQuestions({
        subjectId,
        subjectName: title,
        topicId: selectedTopicObj?.id,
        topicIds: !selectedTopicObj ? dbTopics.map(t => t.id).filter(Boolean) : undefined,
        questionCount: requestedCount,
      });

      console.log('GUEST FLOW:', { user, rows: rows.length, questions: questions.length });

      if (questions.length === 0) {
        // No cached questions — strictly keep the integrated player hidden.
        setGuestStarted(false);
        setMcqs([]);
        setQuestionSource(null);
        setCachedCount(0);
        setAiCount(0);
        openGuestGate();
        toast("AI Generation Available", { description: "No cached questions found. Sign in to generate questions instantly using AI!" });
        setIsLoadingMCQs(false);
        return;
      }

      // Render INSIDE the integrated player (no redirect)
      const transformed: MCQItem[] = questions.map((q: any, i: number) => transformBankQuestion(q, i));
      setMcqs(transformed);
      // Batch-prefetch answer keys in ONE round-trip so each card reveals
      // instantly on click (no per-question latency). Fire-and-forget.
      setPrefetchedAnswers({});
      const ids = transformed.map((q) => q.id).filter(Boolean);
      if (ids.length > 0) {
        prefetchPracticeAnswers(ids)
          .then((map) => setPrefetchedAnswers(map))
          .catch((e) => console.warn('[SubjectContent] answer prefetch failed:', e));
      }
      setQuestionSource('cache');
      setCachedCount(transformed.length);
      setAiCount(0);
      if (selectedTopicObj?.id) {
        setSelectedTopicId(selectedTopicObj.id);
        setSelectedTopic(selectedTopicObj.name);
        setGuestAllowedTopicId(selectedTopicObj.id);
      }
      setGuestStarted(true);
    } catch (error: any) {
      console.error('Guest subject quiz error:', error);
      toast.error("Failed to load questions", { description: error?.message || "Please try again." });
    } finally {
      setIsLoadingMCQs(false);
    }
  };

  // Hydrate context from URL :id when state is missing (refresh / deep-link).
  // Supports BOTH the legacy UUID form and the canonical human slug form.
  useEffect(() => {
    if (ctx.title || !routeId) return;
    let cancelled = false;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(routeId);
    (async () => {
      try {
        const select = 'id, name, description, levels(id, name, system_id, educational_systems(id, name))';
        let data: any = null;
        if (isUuid) {
          const res = await supabase.from('subjects').select(select).eq('id', routeId).maybeSingle();
          data = res.data;
        } else {
          const res = await supabase.from('subjects').select(select);
          data = findBestMatch((res.data || []) as any[], routeId) as any;
        }
        if (cancelled) return;
        if (!data) {
          // Unknown subject → real 404 + noindex (no soft redirect, so Google
          // never reports these as "Page with redirect").
          setNotFound(true);
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
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setIsHydrating(false);
      }
    })();
    return () => { cancelled = true; };
  }, [routeId, ctx.title]);


  useEffect(() => {
    // Wait for hydration before initializing
    if (!title) return;

    
    setIsLoaded(true);
    loadTopicsFromDB();

    if (!user) return;

    // Cache-first: try offline cache before network for logged-in users only
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
          const correctOption = resolveCorrectKey(options, q.answer ?? q.correct_option);
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
        toast("⚡ Loaded from offline cache", { description: `${transformed.length} questions available instantly` });
        return;
      }
    }

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
        
        toast("📚 Topic Selected", { description: `Showing MCQs for "${matchingTopic.name}"` });
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
        // Subject exists in admin LMS — ALWAYS show its topics (even if empty),
        // never fall back to content_items distinct topics. This guarantees that
        // every admin-defined topic appears in dropdowns, even with 0 questions.
        const { data: topicsData } = await supabase
          .from('topics')
          .select('id, name, description')
          .eq('subject_id', subjectData.id)
          .or('approved.is.null,approved.eq.true')
          .order('name');
        
        setDbTopics(topicsData || []);
        return;
      }
      
      // Legacy fallback (only when subject row missing): distinct topics from content_items
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
          ...(difficulty && difficulty !== 'mix' ? { difficulty } : {}),
          question_count: requestedCount,
          forceNew: forceNew && !fetchOnly,
          fetch_only: fetchOnly,
          partial_mode: false,
          // LMS linkage so AI-generated MCQs persist into Question Bank correctly
          subject_id: subjectId,
          subject_name: title,
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
        const correctOption = resolveCorrectKey(options, q.answer ?? q.correct_option);

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

      // If DB returned fewer questions than requested, prompt the user instead of auto-generating.
      if (user && fetchOnly && transformedMCQs.length < requestedCount) {
        console.log(`📭 DB returned ${transformedMCQs.length}/${requestedCount}, prompting for Generate New`);
        setShowGeneratePrompt(true);
      } else {
        setShowGeneratePrompt(false);
      }
      
      if (data.source === 'ai' || data.ai_count > 0) {
        toast(data.source === 'ai' ? "🤖 AI Generated Questions" : "🔀 Mixed Source", { description: data.source === 'ai' 
            ? `Generated ${data.ai_count} new questions and saved to bank`
            : `${data.cached_count} from bank + ${data.ai_count} AI generated` });
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

              const correctOption = resolveCorrectKey(options, q.answer ?? q.correct_option);

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

            toast('Daily AI limit reached', { description: 'Showing practice questions from our question bank.' });

            return;
          }
        } catch (e) {
          console.error('Cache-only fallback failed:', e);
        }
      }

      setLoadError(error.message || 'Failed to load questions');
      setMcqs([]);
      
      // Show error toast
      toast.error("Failed to load questions", { description: error.message || "Please try again or generate new questions" });
    } finally {
      setIsLoadingMCQs(false);
      setIsGenerating(false);
    }
  };

  // Handle generate new questions (Smart Hybrid: bank first → AI fallback)
  const handleGenerateNew = () => {
    if (!user) { openGuestGate(); return; }
    loadMCQs(true, false);
  };

  // Handle refresh (use cache first)
  const handleRefresh = () => {
    if (!user) {
      // For guest, "refresh" simply reshuffles the unlocked free topic
      startGuestSubjectQuiz(guestAllowedTopicId ? { id: guestAllowedTopicId, name: selectedTopic } : undefined);
      return;
    }
    loadMCQs(false);
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
    // Guest: only the unlocked free topic is allowed
    if (!user && value !== "all" && value !== guestAllowedTopicId) {
      openGuestGate();
      return;
    }
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
    if (!user) {
      if (selectedTopicId && guestStarted) {
        const topicObj = dbTopics.find(t => t.id === selectedTopicId);
        if (topicObj && selectedTopicId === guestAllowedTopicId) {
          startGuestSubjectQuiz(topicObj);
        }
      }
      return;
    }
    if (title && isLoaded && selectedTopicId !== "all") {
      // Always fetch fresh from DB on topic/difficulty/count change.
      // loadMCQs will auto top-up via AI if DB returns fewer than requested.
      console.log(`📦 Topic "${selectedTopic}" changed, fetching from DB...`);
      loadMCQs(false, true);
    } else if (title && isLoaded && selectedTopicId === "all") {
      // When switching back to "all", refetch the subject-wide bank too
      console.log('📋 Refetching all-topics from DB');
      loadMCQs(false, true);
    }
  }, [selectedTopicId, user, guestStarted, difficulty, questionCount]);

  // Fetch already returns topic-specific MCQs; skip client-side topic filter
  // to avoid hiding rows whose `topic` string doesn't match exactly.
  const filteredMCQs = mcqs;

  // Track Subject-page practice completion → save to test_attempts
  const answeredRef = useRef<Map<string, boolean>>(new Map());
  const submittedRef = useRef(false);
  const startedAtRef = useRef<number>(Date.now());
  const [showAdvice, setShowAdvice] = useState(false);
  const [adviceScore, setAdviceScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  useEffect(() => {
    answeredRef.current = new Map();
    submittedRef.current = false;
    startedAtRef.current = Date.now();
    setShowAdvice(false);
    setAdviceScore(0);
    setAllAnswered(false);
  }, [mcqs]);

  const handleCardAnswered = async (qid: string, isCorrect: boolean) => {
    if (!user || submittedRef.current) return;
    answeredRef.current.set(qid, isCorrect);
    if (answeredRef.current.size === filteredMCQs.length && filteredMCQs.length > 0) {
      setAllAnswered(true);
    }
    if (answeredRef.current.size < filteredMCQs.length || filteredMCQs.length === 0) return;
    submittedRef.current = true;

    const correct = Array.from(answeredRef.current.values()).filter(Boolean).length;
    const elapsed = Math.round((Date.now() - startedAtRef.current) / 1000);
    const subjectName = title || 'Subject';
    const answersArr = filteredMCQs.map((q) => ({
      topic: (q as any).topic || (selectedTopic !== 'all' ? selectedTopic : subjectName),
      is_correct: !!answeredRef.current.get(q.id),
    }));

    try {
      await processTestCompletion({
        testType: 'subject_practice',
        score: correct,
        totalQuestions: filteredMCQs.length,
        timeTaken: elapsed,
        subjects: [subjectName],
        answers: answersArr as any,
      });
    } catch (e) {
      console.error('subject_practice save failed', e);
    }
    setAdviceScore(Math.round((correct / filteredMCQs.length) * 100));
    setShowAdvice(true);
  };
  
  // SEO subject name: prefer the resolved (DB/state) title; otherwise derive a
  // readable name from the slug — but ONLY when the slug is a human slug, not a
  // DB UUID. This guarantees unique, crawler-visible <title>/description even in
  // the prerendered (SSR) HTML where `title` hasn't hydrated from the DB yet.
  const isUuidRoute = !!routeId && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(routeId);
  const humanizedRouteId =
    routeId && !isUuidRoute
      ? routeId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "";
  const seoSubject = title || humanizedRouteId;

  if (notFound) {
    return (
      <Header>
        <SEOHead
          title="Subject not found"
          description="This subject page does not exist on MCQsAI. Browse all available subjects instead."
          noindex
        />
        <div className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-xl font-semibold mb-2">Subject not found</h1>
          <p className="text-sm text-muted-foreground mb-6">
            The subject you're looking for doesn't exist or was removed.
          </p>
          <Button asChild>
            <Link to="/subjects">Browse all subjects</Link>
          </Button>
        </div>
      </Header>
    );
  }

  return (

    <Header>
      <SEOHead
        title={seoSubject ? `${seoSubject} MCQs with Answers — Free Practice` : 'Subject Practice'}
        description={seoSubject ? `Free ${seoSubject} MCQs with answers and detailed explanations. AI-powered ${seoSubject} practice questions for MDCAT, ECAT, NTS, FPSC & board exams — MCQsAI Pakistan.` : 'Practice free subject-wise MCQs with answers and detailed explanations. AI-powered question practice for MDCAT, ECAT, NTS & board exams in Pakistan — MCQsAI.'}
        keywords={seoSubject ? `${seoSubject} MCQs, ${seoSubject} MCQs with answers, ${seoSubject} past papers, ${seoSubject} quiz, ${seoSubject} practice questions Pakistan` : undefined}
        noindex={isRunnerVariant}
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
          
          {(user || guestStarted) && (
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
          {(user || guestStarted) ? (
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
          ) : (
            <div className="mb-2" />
          )}

          
          {/* Guest landing: Freemium Tease & Gate — first topic free, others locked */}
          {!user && !guestStarted ? (
            <GuestTopicsGate
              subjectTitle={title || 'Subject'}
              topics={dbTopics.length > 0 ? dbTopics : topics.map(t => ({ name: t.title, description: t.content }))}
              onStartFirstTopic={(t) => startGuestSubjectQuiz({ id: t.id, name: t.name })}
              isLoading={isLoadingMCQs}
            />
          ) : isLoadingMCQs && !isGenerating ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Loading questions...</span>
            </div>
          ) : loadError ? (
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
                  serverScored={!user}
                  prefetched={!user ? prefetchedAnswers[mcq.id] : undefined}
                  onAnswered={user ? handleCardAnswered : undefined}
                />
              ))}
              {allAnswered && !showAdvice && (
                <button
                  onClick={() => {
                    const correct = Array.from(answeredRef.current.values()).filter(Boolean).length;
                    setAdviceScore(Math.round((correct / filteredMCQs.length) * 100));
                    setShowAdvice(true);
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-xl font-medium mt-4"
                >
                  ✅ Finish Practice & See Results
                </button>
              )}
              {showAdvice && (
                <ResultAdviceCard
                  name={(user?.user_metadata as any)?.full_name || user?.email?.split('@')[0]}
                  score={adviceScore}
                  subject={title}
                  topic={selectedTopic !== 'all' ? selectedTopic : undefined}
                  isGuest={!user}
                />
              )}
            </div>
          ) : (
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

      {/* Guest Gate Dialog (premium actions inside integrated player) */}
      <Dialog open={guestGateOpen} onOpenChange={setGuestGateOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center mb-2 shadow-brand">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <DialogTitle className="text-center text-xl">Sign In to Unlock</DialogTitle>
            <DialogDescription className="text-center">
              Unlock all topics, AI-generated questions, and advanced practice features by signing in for free.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 pt-2">
            <Button
              onClick={() => { setGuestGateOpen(false); navigate('/sign-in'); }}
              className="w-full h-11 bg-brand-gradient text-white shadow-brand"
            >
              Sign In — It's Free
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setGuestGateOpen(false)}>
              Maybe later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Header>
  );
};

export default SubjectContent;
