import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';
import { supabase } from '@/integrations/supabase/client';
import { GlassSearchInput } from '@/components/ui/GlassSearchInput';
import { GlobalSearchResult } from '@/services/globalSearchService';
import { getQuestionsWithFallbackInfo, generateFromRAGForSyllabus } from '@/services/syllabusRAGFallback';

import { useSyllabusData } from './hooks/useSyllabusData';
import { useSyllabusTemplates } from './hooks/useSyllabusTemplates';
import { GlassFilterSidebar } from './GlassFilterSidebar';
import { SubjectGrid } from './SubjectGrid';
import { SelectionSummary } from './SelectionSummary';
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

  // Generate test with DB-first fallback logic
  const handleGenerateQuiz = async () => {
    if (!user) {
      toast({
        title: "Sign in to Continue",
        description: "Please sign in to generate personalized tests.",
      });
      navigate('/auth');
      return;
    }

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
      // Step 1: Check existing questions in DB
      const fallbackInfo = await getQuestionsWithFallbackInfo({
        topicIds: selectedTopicIds,
        requestedCount: quizSettings.questionsCount,
        difficulty: quizSettings.difficulty
      });

      // Step 2: If we have enough questions, create test from DB
      if (fallbackInfo.hasEnough) {
        // Create test session from cached questions
        const { data: session, error: sessionError } = await supabase
          .from('custom_test_sessions')
          .insert({
            user_id: user.id,
            session_name: syllabusName,
            question_count: fallbackInfo.questions.length,
            time_limit: quizSettings.timeLimit,
            topics: selectedTopicIds,
            difficulty_levels: [quizSettings.difficulty],
            questions: fallbackInfo.questions.map(q => ({
              id: q.id,
              question: q.title,
              options: q.options,
              correctOption: q.correctOption,
              explanation: q.explanation,
              difficulty: q.difficulty,
              subject: q.subject,
              topic: q.topic
            })),
            is_active: true
          })
          .select('id')
          .single();

        if (sessionError) throw sessionError;

        toast({
          title: "✅ Test Ready!",
          description: `${fallbackInfo.questions.length} questions loaded from Question Bank.`,
          duration: 5000
        });

        navigate(`/test-session/${session.id}`);
        return;
      }

      // Step 3: Not enough questions - check if admin can generate from RAG
      if (!isAdmin) {
        toast({
          title: "❌ Not Enough Questions",
          description: `Only ${fallbackInfo.questions.length}/${quizSettings.questionsCount} questions available. Please try different topics or reduce the count.`,
          variant: "destructive",
          duration: 6000
        });
        setIsGenerating(false);
        return;
      }

      // Step 4: Admin path - offer RAG generation if documents exist
      if (!fallbackInfo.ragAvailable) {
        toast({
          title: "📚 No Course Materials",
          description: `Found ${fallbackInfo.questions.length} questions. This topic has no uploaded study material for RAG generation.`,
          variant: "destructive",
          duration: 6000
        });
        setIsGenerating(false);
        return;
      }

      // Step 5: Admin can generate from RAG
      toast({
        title: "Generating from Course Materials...",
        description: `Found ${fallbackInfo.ragDocumentCount} documents. Generating ${fallbackInfo.shortage} additional questions.`
      });

      const ragResult = await generateFromRAGForSyllabus({
        topicIds: selectedTopicIds,
        count: fallbackInfo.shortage,
        difficulty: quizSettings.difficulty
      });

      if (!ragResult.success || ragResult.saved === 0) {
        // Parse error type for user-friendly messages
        const errorMsg = ragResult.error || "";
        let toastTitle = "Generation Failed";
        let toastDescription = "Could not generate questions. Please try again.";

        if (errorMsg.toLowerCase().includes("quota") || errorMsg.toLowerCase().includes("rate limit")) {
          toastTitle = "⏳ Daily Quota Reached";
          toastDescription = "AI generation quota reached. Please try again later.";
        } else if (errorMsg.toLowerCase().includes("no_rag_data") || errorMsg.toLowerCase().includes("no rag documents")) {
          toastTitle = "📚 No Study Material";
          toastDescription = "No course material found for these topics. Upload PDFs first.";
        } else if (errorMsg.toLowerCase().includes("credit") || errorMsg.toLowerCase().includes("402")) {
          toastTitle = "💳 Credits Exhausted";
          toastDescription = "AI credits exhausted. Please add credits to your workspace.";
        } else if (errorMsg) {
          toastDescription = errorMsg;
        }

        // Fall back to partial test if we have some questions
        if (fallbackInfo.questions.length > 0) {
          toast({
            title: "Partial Test Created",
            description: `${toastDescription} Created test with ${fallbackInfo.questions.length} available questions.`
          });
          
          const { data: session } = await supabase
            .from('custom_test_sessions')
            .insert({
              user_id: user.id,
              session_name: syllabusName,
              question_count: fallbackInfo.questions.length,
              time_limit: quizSettings.timeLimit,
              topics: selectedTopicIds,
              difficulty_levels: [quizSettings.difficulty],
              questions: fallbackInfo.questions.map(q => ({
                id: q.id,
                question: q.title,
                options: q.options,
                correctOption: q.correctOption,
                explanation: q.explanation,
                difficulty: q.difficulty,
                subject: q.subject,
                topic: q.topic
              })),
              is_active: true
            })
            .select('id')
            .single();

          if (session) navigate(`/test-session/${session.id}`);
          return;
        }

        toast({
          title: toastTitle,
          description: toastDescription,
          variant: "destructive"
        });
        setIsGenerating(false);
        return;
      }

      // Step 6: Re-fetch questions after RAG generation and create test
      const updatedInfo = await getQuestionsWithFallbackInfo({
        topicIds: selectedTopicIds,
        requestedCount: quizSettings.questionsCount,
        difficulty: quizSettings.difficulty
      });

      const { data: session } = await supabase
        .from('custom_test_sessions')
        .insert({
          user_id: user.id,
          session_name: syllabusName,
          question_count: updatedInfo.questions.length,
          time_limit: quizSettings.timeLimit,
          topics: selectedTopicIds,
          difficulty_levels: [quizSettings.difficulty],
          questions: updatedInfo.questions.map(q => ({
            id: q.id,
            question: q.title,
            options: q.options,
            correctOption: q.correctOption,
            explanation: q.explanation,
            difficulty: q.difficulty,
            subject: q.subject,
            topic: q.topic
          })),
          is_active: true
        })
        .select('id')
        .single();

      toast({
        title: "🎉 Test Generated!",
        description: `${fallbackInfo.questions.length} from Question Bank + ${ragResult.saved} generated from course material.`,
        duration: 5000
      });

      if (session) navigate(`/test-session/${session.id}`);

    } catch (error) {
      console.error('Quiz generation error:', error);
      toast({
        title: "Generation Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-4 pb-24 lg:pb-10">
      {/* Hero Header */}
      <motion.div
        className="mb-4 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold mb-1 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Syllabus Builder
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-2">
          Select subjects and topics from your syllabus to create a personalized test
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Badge variant="secondary" className="px-2 py-1 text-xs">
            <span className="text-primary font-bold mr-1">{selectedSubjectsCount}</span> Subjects
            {selectedSubjectsCount >= MAX_SUBJECTS && <span className="text-destructive ml-1">(max)</span>}
          </Badge>
          <Badge variant="secondary" className="px-2 py-1 text-xs">
            <span className="text-primary font-bold mr-1">{selectedTopicsCount}</span> Topics
          </Badge>
        </div>
      </motion.div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Sidebar - Glass Filters */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
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

        {/* Center - Subject Grid */}
        <div className="lg:col-span-2 space-y-4">
          {/* Glass Search Bar */}
          <GlassSearchInput
            placeholder="Search subjects or topics..."
            onSelect={handleSmartSearchSelect}
          />

          {/* Subject Cards */}
          <SubjectGrid
            subjects={filteredSubjects}
            loading={loading}
            topicQuestionCounts={topicQuestionCounts}
            onToggleSubject={handleToggleSubject}
            onToggleTopic={handleToggleTopic}
            onToggleExpand={handleToggleExpand}
            onClearFilters={clearFilters}
          />
        </div>

        {/* Right Sidebar - Quiz Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <SelectionSummary
              selectedSubjectsCount={selectedSubjectsCount}
              selectedTopicsCount={selectedTopicsCount}
              syllabusName={syllabusName}
              setSyllabusName={setSyllabusName}
              quizSettings={quizSettings}
              updateQuizSettings={updateQuizSettings}
              onClearSelection={handleClearSelection}
              onGenerateQuiz={handleGenerateQuiz}
              isGenerating={isGenerating}
              onSaveTemplate={handleSaveTemplate}
              isSavingTemplate={isSavingTemplate}
            />
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      {selectedTopicsCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur-sm border-t lg:hidden z-40 safe-area-inset-bottom">
          <Button
            onClick={handleGenerateQuiz}
            className="w-full h-10"
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : `Generate Test (${selectedTopicsCount} Topics)`}
          </Button>
        </div>
      )}
    </div>
  );
};
