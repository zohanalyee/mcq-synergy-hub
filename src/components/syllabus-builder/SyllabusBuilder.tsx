import { useState, useCallback, useMemo, useEffect } from 'react';
import { resolveCorrectAnswer } from '@/lib/testEvaluation';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';
import { supabase } from '@/integrations/supabase/client';
import { GlassSearchInput } from '@/components/ui/GlassSearchInput';
import { GlobalSearchResult } from '@/services/globalSearchService';
import { getQuestionsWithFallbackInfo } from '@/services/syllabusRAGFallback';
import { buildGuestSession, saveGuestSession } from '@/lib/guestSession';

import { useSyllabusData } from './hooks/useSyllabusData';
import { useSyllabusTemplates } from './hooks/useSyllabusTemplates';
import { GlassFilterSidebar } from './GlassFilterSidebar';
import { SubjectGrid } from './SubjectGrid';
import { FloatingActionBar } from './FloatingActionBar';
import { SyllabusSubject, QuizSettings, SavedSyllabusTemplate } from './interfaces';

const MAX_SUBJECTS = 10;

export const SyllabusBuilder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useUserRole();
  const { user } = useAuth();
  const [syllabusName, setSyllabusName] = useState('My Custom Test');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [perTopicQuestionCounts, setPerTopicQuestionCounts] = useState<Record<string, number>>({});
  const [quizSettings, setQuizSettings] = useState<QuizSettings>({
    timeLimit: 30,
    questionsCount: 20,
    difficulty: 'medium'
  });

  const {
    systems,
    availableLevels,
    filteredSubjects,
    rawSubjects,
    setRawSubjects,
    topicQuestionCounts,
    loading,
    filterState,
    toggleSystemFilter,
    toggleLevelFilter,
    setSearchQuery,
    clearFilters,
    setFilterState
  } = useSyllabusData();

  const { saveTemplate } = useSyllabusTemplates(user?.id);

  // Handle template loading from navigation state (from Dashboard)
  useEffect(() => {
    const templateToLoad = location.state?.templateToLoad as SavedSyllabusTemplate | undefined;
    if (templateToLoad) {
      handleLoadTemplate(templateToLoad);
      // Clear the state to prevent re-loading on subsequent renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Prefill search from URL params (?subject=, ?topic=, ?q=) — used by SEO landing-page deep-links
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('topic') || params.get('subject') || params.get('q');
    if (q && q.trim().length > 0) {
      setSearchQuery(q.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Calculate selection counts
  const { selectedSubjectsCount, selectedTopicsCount, selectedTopicIds } = useMemo(() => {
    let subjectsCount = 0;
    let topicsCount = 0;
    const topicIds: string[] = [];
    
    rawSubjects.forEach(subject => {
      const selectedTopics = subject.topics.filter(t => t.isSelected);
      if (selectedTopics.length > 0) {
        subjectsCount++;
        topicsCount += selectedTopics.length;
        selectedTopics.forEach(t => topicIds.push(t.id));
      }
    });

    return { selectedSubjectsCount: subjectsCount, selectedTopicsCount: topicsCount, selectedTopicIds: topicIds };
  }, [rawSubjects]);

  // Check if adding a subject would exceed the limit
  const wouldExceedLimit = useCallback((subjectId: string) => {
    const currentlySelectedSubjects = rawSubjects.filter(s => 
      s.id !== subjectId && s.topics.some(t => t.isSelected)
    );
    return currentlySelectedSubjects.length >= MAX_SUBJECTS;
  }, [rawSubjects]);

  // Toggle subject selection (select/deselect all topics)
  const handleToggleSubject = useCallback((subjectId: string) => {
    setRawSubjects(prev => {
      const subject = prev.find(s => s.id === subjectId);
      if (!subject) return prev;

      const allSelected = subject.topics.every(t => t.isSelected);
      const isSelecting = !allSelected;

      // Check limit when selecting
      if (isSelecting) {
        const currentlySelectedCount = prev.filter(s => 
          s.id !== subjectId && s.topics.some(t => t.isSelected)
        ).length;
        
        if (currentlySelectedCount >= MAX_SUBJECTS) {
          toast({
            title: "Maximum Subjects Reached",
            description: `You can select up to ${MAX_SUBJECTS} subjects at a time.`,
            variant: "destructive"
          });
          return prev;
        }
      }

      return prev.map(s => {
        if (s.id === subjectId) {
          return {
            ...s,
            isSelected: !allSelected,
            topics: s.topics.map(t => ({ ...t, isSelected: !allSelected }))
          };
        }
        return s;
      });
    });
  }, [setRawSubjects]);

  // Toggle individual topic selection
  const handleToggleTopic = useCallback((subjectId: string, topicId: string) => {
    setRawSubjects(prev => {
      const subject = prev.find(s => s.id === subjectId);
      if (!subject) return prev;

      const topic = subject.topics.find(t => t.id === topicId);
      if (!topic) return prev;

      // Check if this is a new subject being added
      const isSubjectCurrentlySelected = subject.topics.some(t => t.isSelected);
      const isSelectingTopic = !topic.isSelected;

      // If selecting a topic in a new subject, check limit
      if (isSelectingTopic && !isSubjectCurrentlySelected) {
        const currentlySelectedCount = prev.filter(s => 
          s.id !== subjectId && s.topics.some(t => t.isSelected)
        ).length;
        
        if (currentlySelectedCount >= MAX_SUBJECTS) {
          toast({
            title: "Maximum Subjects Reached",
            description: `You can select up to ${MAX_SUBJECTS} subjects at a time.`,
            variant: "destructive"
          });
          return prev;
        }
      }

      return prev.map(s => {
        if (s.id === subjectId) {
          const newTopics = s.topics.map(t => 
            t.id === topicId ? { ...t, isSelected: !t.isSelected } : t
          );
          return {
            ...s,
            topics: newTopics,
            isSelected: newTopics.some(t => t.isSelected)
          };
        }
        return s;
      });
    });
  }, [setRawSubjects]);

  // Toggle subject expansion
  const handleToggleExpand = useCallback((subjectId: string) => {
    setRawSubjects(prev => prev.map(subject => 
      subject.id === subjectId 
        ? { ...subject, isExpanded: !subject.isExpanded }
        : subject
    ));
  }, [setRawSubjects]);

  // Clear all selections
  const handleClearSelection = useCallback(() => {
    setRawSubjects(prev => prev.map(subject => ({
      ...subject,
      isSelected: false,
      topics: subject.topics.map(t => ({ ...t, isSelected: false }))
    })));
  }, [setRawSubjects]);

  // Update quiz settings
  const updateQuizSettings = useCallback((key: keyof QuizSettings, value: any) => {
    setQuizSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Save template handler
  const handleSaveTemplate = async (templateName: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Sign in Required",
        description: "Please sign in to save templates.",
        variant: "destructive"
      });
      return false;
    }

    setIsSavingTemplate(true);
    try {
      const success = await saveTemplate(templateName, filterState, selectedTopicIds, quizSettings);
      return success;
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Load template handler
  const handleLoadTemplate = useCallback((template: SavedSyllabusTemplate) => {
    // Restore filter state
    if (setFilterState && template.filter_state) {
      setFilterState(template.filter_state);
    }

    // Restore quiz settings
    if (template.quiz_settings) {
      setQuizSettings(template.quiz_settings);
    }

    // Restore topic selections
    const selectedIds = new Set(template.selected_topic_ids);
    setRawSubjects(prev => prev.map(subject => {
      const newTopics = subject.topics.map(t => ({
        ...t,
        isSelected: selectedIds.has(t.id)
      }));
      return {
        ...subject,
        topics: newTopics,
        isSelected: newTopics.some(t => t.isSelected),
        isExpanded: newTopics.some(t => t.isSelected)
      };
    }));

    toast({
      title: "Template Loaded",
      description: `"${template.name}" has been applied.`
    });
  }, [setFilterState, setRawSubjects]);

  // Handle smart search selection - auto-select topic or expand subject
  const handleSmartSearchSelect = useCallback((item: GlobalSearchResult) => {
    if (item.result_type === 'topic') {
      // Find the subject and topic, then select it
      setRawSubjects(prev => {
        // Check if this would exceed the limit
        const subject = prev.find(s => s.id === item.subject_id);
        if (!subject) return prev;

        const isSubjectCurrentlySelected = subject.topics.some(t => t.isSelected);
        
        if (!isSubjectCurrentlySelected) {
          const currentlySelectedCount = prev.filter(s => 
            s.id !== item.subject_id && s.topics.some(t => t.isSelected)
          ).length;
          
          if (currentlySelectedCount >= MAX_SUBJECTS) {
            toast({
              title: "Maximum Subjects Reached",
              description: `You can select up to ${MAX_SUBJECTS} subjects at a time.`,
              variant: "destructive"
            });
            return prev;
          }
        }

        return prev.map(s => {
          if (s.id === item.subject_id) {
            const newTopics = s.topics.map(t => 
              t.id === item.id ? { ...t, isSelected: true } : t
            );
            return {
              ...s,
              topics: newTopics,
              isSelected: newTopics.some(t => t.isSelected),
              isExpanded: true
            };
          }
          return s;
        });
      });

      toast({
        title: "Topic Added",
        description: `"${item.name}" has been added to your selection.`
      });
    } else {
      // For subjects, expand and select all topics
      const subject = rawSubjects.find(s => s.id === item.id);
      if (subject) {
        // Check limit
        const currentlySelectedCount = rawSubjects.filter(s => 
          s.id !== item.id && s.topics.some(t => t.isSelected)
        ).length;
        
        if (currentlySelectedCount >= MAX_SUBJECTS && !subject.topics.some(t => t.isSelected)) {
          toast({
            title: "Maximum Subjects Reached",
            description: `You can select up to ${MAX_SUBJECTS} subjects at a time.`,
            variant: "destructive"
          });
          return;
        }

        setRawSubjects(prev => prev.map(s => {
          if (s.id === item.id) {
            return {
              ...s,
              isSelected: true,
              isExpanded: true,
              topics: s.topics.map(t => ({ ...t, isSelected: true }))
            };
          }
          return s;
        }));

        toast({
          title: "Subject Added",
          description: `All topics from "${item.name}" have been added.`
        });
      }
    }
  }, [rawSubjects, setRawSubjects]);

  // Maximum questions to auto-generate via AI
  const MAX_AUTO_GENERATE = 200;

  // Generate test with smart hybrid logic: bank-first + AI generation for shortages
  const handleGenerateQuiz = async () => {
    if (selectedTopicsCount === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one topic for your test.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const requestedCount = quizSettings.questionsCount;

      if (!user) {
        const bankResult = await getQuestionsWithFallbackInfo({
          topicIds: selectedTopicIds,
          requestedCount,
          difficulty: undefined,
        });
        if (bankResult.questions.length === 0) {
          toast({ title: "No bank questions available", description: "Please select different topics." });
          return;
        }
        const session = createGuestTestSession(bankResult.questions.slice(0, requestedCount));
        toast({ title: "✅ Test Ready!", description: `${bankResult.questions.length} questions loaded from Question Bank.` });
        navigate(`/test-session/${session}`);
        return;
      }

      // Step 1: Check question bank
      console.log('=== HYBRID GENERATION START ===');
      console.log('Selected topics:', selectedTopicIds);
      console.log('Requested:', requestedCount, 'Difficulty:', quizSettings.difficulty);

      const bankResult = await getQuestionsWithFallbackInfo({
        topicIds: selectedTopicIds,
        requestedCount,
        difficulty: quizSettings.difficulty,
        userId: user.id
      });

      const foundInBank = bankResult.questions.length;
      const shortage = Math.max(0, requestedCount - foundInBank);

      console.log('Found in bank:', foundInBank, 'Shortage:', shortage);

      // Difficulty fallback notification
      if (bankResult.usedDifficultyFallback && foundInBank > 0) {
        toast({
          title: "ℹ️ Difficulty Adjusted",
          description: `No ${quizSettings.difficulty} questions found. Using available difficulties instead.`,
          duration: 4000
        });
      }

      // Step 2: Enough in bank? Create test immediately
      if (shortage <= 0) {
        console.log('✅ Enough in bank, creating test directly');
        const session = await createTestSession(bankResult.questions.slice(0, requestedCount));
        if (session) {
          toast({
            title: "✅ Test Ready!",
            description: `${requestedCount} questions loaded instantly from Question Bank.`,
            duration: 5000
          });
          navigate(`/test-session/${session}`);
        }
        return;
      }

      // Step 3: Some questions exist but not enough — or zero
      if (shortage > MAX_AUTO_GENERATE) {
        toast({
          title: "⚠️ Too Many Questions Needed",
          description: `Need to generate ${shortage} questions which exceeds the limit of ${MAX_AUTO_GENERATE}. Please reduce the quantity or select topics with more existing questions.`,
          variant: "destructive",
          duration: 6000
        });
        setIsGenerating(false);
        return;
      }

      // Step 4: Generate shortage via AI
      if (foundInBank > 0) {
        toast({
          title: "🔄 Generating Additional Questions...",
          description: `Found ${foundInBank} in bank. Generating ${shortage} more (~${Math.ceil(shortage / 15) * 10}s)...`,
          duration: 8000
        });
      } else {
        toast({
          title: "🔄 Generating Questions...",
          description: `Generating ${shortage} questions via AI (~${Math.ceil(shortage / 15) * 10}s). They'll be saved for instant reuse!`,
          duration: 8000
        });
      }

      console.log('🤖 Calling generate-test for', shortage, 'questions');
      const generatedResult = await supabase.functions.invoke('generate-test', {
        body: {
          topic_ids: selectedTopicIds,
          difficulty: quizSettings.difficulty === 'mixed' ? undefined : quizSettings.difficulty,
          question_count: shortage,
          mode: 'bank_only',
          forceNew: true
        }
      });

      if (generatedResult.error) {
        console.error('AI generation error details:', {
          error: generatedResult.error,
          message: generatedResult.error?.message,
        });
        
        const errMsg = generatedResult.error?.message || '';
        
        if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('rate limit')) {
          toast({ title: "⏳ API Rate Limited", description: "AI generation temporarily unavailable. Please try again in a few minutes.", variant: "destructive", duration: 6000 });
        } else if (errMsg.includes('402') || errMsg.includes('credit')) {
          toast({ title: "💳 Credits Exhausted", description: "AI generation credits exhausted. Contact administrator.", variant: "destructive", duration: 6000 });
        } else {
          toast({ title: "⚠️ AI Generation Failed", description: `Error: ${errMsg || 'Unknown error'}. Try reducing question count.`, variant: "destructive", duration: 6000 });
        }

        // If we have bank questions, use them as fallback
        if (foundInBank > 0) {
          toast({
            title: "Using Available Questions",
            description: `Creating test with ${foundInBank} questions from bank.`,
            duration: 4000
          });
          const session = await createTestSession(bankResult.questions);
          if (session) navigate(`/test-session/${session}`);
          return;
        }
        throw new Error(errMsg || 'AI generation failed');
      }

      // Step 5: Re-fetch from bank (now includes newly generated questions)
      console.log('📥 Re-fetching from bank after generation...');
      const updatedBank = await getQuestionsWithFallbackInfo({
        topicIds: selectedTopicIds,
        requestedCount,
        difficulty: quizSettings.difficulty,
        userId: user.id
      });

      const finalQuestions = updatedBank.questions.slice(0, requestedCount);
      console.log('Final questions:', finalQuestions.length);

      // Notify if subject fallback was used
      if (updatedBank.usedSubjectFallback) {
        toast({
          title: "ℹ️ Using Related Questions",
          description: "No questions found for selected topics. Using questions from the same subject instead.",
          duration: 5000
        });
      }

      if (finalQuestions.length === 0) {
        toast({
          title: "❌ Generation Failed",
          description: "No questions could be generated. Please try again or select different topics.",
          variant: "destructive"
        });
        setIsGenerating(false);
        return;
      }

      if (finalQuestions.length < requestedCount * 0.8) {
        toast({
          title: "⚠️ Partial Test",
          description: `Generated ${finalQuestions.length} of ${requestedCount} requested. Creating test with available questions.`,
          duration: 5000
        });
      }

      // Step 6: Create test
      const session = await createTestSession(finalQuestions);
      if (session) {
        const newlyGenerated = finalQuestions.length - foundInBank;
        toast({
          title: "✅ Test Ready!",
          description: newlyGenerated > 0
            ? `${foundInBank} from bank + ${newlyGenerated} newly generated. Bank grew to ${updatedBank.questions.length}! 🌱`
            : `${finalQuestions.length} questions loaded from Question Bank.`,
          duration: 6000
        });
        navigate(`/test-session/${session}`);
      }

    } catch (error: any) {
      console.error('Quiz generation error:', error);
      
      let title = "Generation Failed";
      let description = "An error occurred. Please try again.";
      
      const errMsg = error?.message || '';
      if (errMsg.includes('quota') || errMsg.includes('rate limit') || errMsg.includes('429')) {
        title = "⏳ AI Rate Limited";
        description = "AI generation quota reached. Please try again in a few minutes.";
      } else if (errMsg.includes('402') || errMsg.includes('credit')) {
        title = "💳 Credits Exhausted";
        description = "AI credits exhausted. Contact admin.";
      }
      
      toast({ title, description, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const createGuestTestSession = (questions: any[]): string => {
    const uniqueSubjects = [...new Set(questions.map(q => q.subject).filter(Boolean))];
    const session = buildGuestSession({
      session_name: syllabusName,
      time_limit: quizSettings.timeLimit,
      topics: selectedTopicIds,
      subjects: uniqueSubjects,
      difficulty_levels: ['mixed'],
      questions: questions.map(q => ({
        id: q.id,
        question: q.title || q.question,
        title: q.title || q.question,
        options: q.options,
        correctOption: q.correctOption,
        answer: resolveCorrectAnswer(q),
        explanation: q.explanation,
        difficulty: q.difficulty,
        subject: q.subject,
        topic: q.topic,
      })),
    });
    saveGuestSession(session);
    return session.id;
  };

  // Helper to create a test session and return session ID
  const createTestSession = async (questions: any[]): Promise<string | null> => {
    // Extract unique subject names from questions for analytics tracking
    const uniqueSubjects = [...new Set(
      questions.map(q => q.subject).filter(Boolean)
    )];

    const { data: session, error } = await supabase
      .from('custom_test_sessions')
      .insert({
        user_id: user!.id,
        session_name: syllabusName,
        question_count: questions.length,
        time_limit: quizSettings.timeLimit,
        topics: selectedTopicIds,
        subjects: uniqueSubjects,
        difficulty_levels: [quizSettings.difficulty],
        questions: questions.map(q => {
          const resolved = resolveCorrectAnswer(q);
          return {
            id: q.id,
            question: q.title,
            options: q.options,
            correctOption: q.correctOption,
            answer: resolved, // canonical resolved answer text
            explanation: q.explanation,
            difficulty: q.difficulty,
            subject: q.subject,
            topic: q.topic
          };
        }),
        is_active: true
      })
      .select('id')
      .single();

    if (error) {
      console.error('Session creation error:', error);
      throw error;
    }
    return session?.id || null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pt-4 pb-28">
      {/* Hero Header */}
      <motion.div
        className="mb-4 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold mb-1 inline-flex items-center justify-center gap-2">
          <motion.span
            initial={{ rotate: -15, scale: 0.8, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
            className="inline-flex"
          >
            <Sparkles
              className="h-6 w-6 md:h-7 md:w-7 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
              aria-hidden="true"
            />
          </motion.span>
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Syllabus Builder
          </span>
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-2">
          Select subjects and topics from your syllabus to create a{' '}
          <span className="text-primary font-semibold">personalized test</span>
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Badge variant="secondary" className="px-2 py-1 text-xs">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={selectedSubjectsCount}
                initial={{ scale: 0.5, opacity: 0, y: -4 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.5, opacity: 0, y: 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                className="text-primary font-bold mr-1 inline-block"
              >
                {selectedSubjectsCount}
              </motion.span>
            </AnimatePresence>
            Subjects Selected
            {selectedSubjectsCount >= MAX_SUBJECTS && <span className="text-destructive ml-1">(max)</span>}
          </Badge>
          <Badge variant="secondary" className="px-2 py-1 text-xs">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={selectedTopicsCount}
                initial={{ scale: 0.5, opacity: 0, y: -4 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.5, opacity: 0, y: 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                className="text-primary font-bold mr-1 inline-block"
              >
                {selectedTopicsCount}
              </motion.span>
            </AnimatePresence>
            Topics Selected
          </Badge>
        </div>
      </motion.div>

      {/* Search + Filter Row */}
      <div className="flex items-center gap-2 mb-3 flex-nowrap min-w-0">
        <div className="flex-1 min-w-0">
          <GlassSearchInput
            placeholder="Search subjects or topics..."
            onSelect={handleSmartSearchSelect}
          />
        </div>
        <div className="flex-shrink-0">
          <GlassFilterSidebar
            systems={systems}
            availableLevels={availableLevels}
            filterState={filterState}
            toggleSystemFilter={toggleSystemFilter}
            toggleLevelFilter={toggleLevelFilter}
            clearFilters={clearFilters}
          />
        </div>
      </div>

      {/* Subject Cards Grid (full width) */}
      <SubjectGrid
        subjects={filteredSubjects}
        loading={loading}
        topicQuestionCounts={topicQuestionCounts}
        onToggleSubject={handleToggleSubject}
        onToggleTopic={handleToggleTopic}
        onToggleExpand={handleToggleExpand}
        onClearFilters={clearFilters}
      />

      {/* Floating Action Bar */}
      <FloatingActionBar
        selectedSubjectsCount={selectedSubjectsCount}
        selectedTopicsCount={selectedTopicsCount}
        syllabusName={syllabusName}
        setSyllabusName={setSyllabusName}
        quizSettings={quizSettings}
        updateQuizSettings={updateQuizSettings}
        onGenerateQuiz={handleGenerateQuiz}
        isGenerating={isGenerating}
        onSaveTemplate={user ? handleSaveTemplate : undefined}
        isSavingTemplate={isSavingTemplate}
        saveDisabledMessage={!user ? "Sign in to save your syllabus" : undefined}
        topicQuestionCounts={topicQuestionCounts}
        selectedTopicIds={selectedTopicIds}
        subjects={rawSubjects}
        perTopicCounts={perTopicQuestionCounts}
        onPerTopicCountsChange={(counts, deselectedIds) => {
          setPerTopicQuestionCounts(counts);
          // Deselect topics that were unchecked in the modal
          if (deselectedIds.length > 0) {
            setRawSubjects(prev => prev.map(s => ({
              ...s,
              topics: s.topics.map(t => 
                deselectedIds.includes(t.id) ? { ...t, isSelected: false } : t
              ),
              isSelected: s.topics.some(t => t.isSelected && !deselectedIds.includes(t.id))
            })));
          }
          // Update total questions count from per-topic counts
          const totalFromTopics = selectedTopicIds
            .filter(id => !deselectedIds.includes(id))
            .reduce((sum, id) => sum + (counts[id] || 5), 0);
          if (totalFromTopics > 0) {
            updateQuizSettings('questionsCount', totalFromTopics);
          }
        }}
      />
    </div>
  );
};
