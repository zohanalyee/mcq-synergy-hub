import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SmartSearchInput } from '@/components/ui/SmartSearchInput';
import { GlobalSearchResult } from '@/services/globalSearchService';

import { useSyllabusData } from './hooks/useSyllabusData';
import { useSyllabusTemplates } from './hooks/useSyllabusTemplates';
import { FilterSidebar } from './FilterSidebar';
import { SubjectGrid } from './SubjectGrid';
import { SelectionSummary } from './SelectionSummary';
import { SyllabusSubject, QuizSettings, SavedSyllabusTemplate } from './interfaces';

const MAX_SUBJECTS = 10;

export const SyllabusBuilder = () => {
  const navigate = useNavigate();
  const location = useLocation();
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

  // Generate test with smart AI prompting

  // Generate quiz with smart AI prompting
  const handleGenerateQuiz = async () => {
    if (!user) {
      toast({
        title: "Sign in to Continue",
        description: "Please sign in to generate personalized AI tests.",
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
      // Gather selected subjects and topics
      const selectedSubjects = rawSubjects.filter(s => s.topics.some(t => t.isSelected));
      
      // Build structured subject_topic_map for enhanced AI prompting
      const subjectTopicMap = selectedSubjects.map(subject => ({
        subject: subject.name,
        topics: subject.topics.filter(t => t.isSelected).map(t => t.name)
      }));

      // Build system instruction for balanced distribution
      let systemInstruction = '';
      if (selectedSubjects.length > 1) {
        const subjectList = selectedSubjects.map(s => s.name).join(', ');
        systemInstruction = `Create a balanced test distributing the ${quizSettings.questionsCount} questions among the selected subjects: ${subjectList}. Each subject should get approximately equal representation.`;
      }

      // Legacy topic string for backward compatibility
      const selectedTopicsString = selectedSubjects
        .map(subject => {
          const topics = subject.topics.filter(t => t.isSelected).map(t => t.name).join(', ');
          return `${subject.name}: ${topics}`;
        })
        .join('; ');

      const usePartialMode = quizSettings.questionsCount > 20;

      // Call AI to generate test with enhanced payload
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('generate-test', {
        body: {
          topic: selectedTopicsString,
          subject_topic_map: subjectTopicMap,
          system_instruction: systemInstruction,
          difficulty: quizSettings.difficulty,
          question_count: quizSettings.questionsCount,
          partial_mode: usePartialMode
        }
      });

      if (aiError) {
        const errorMessage = aiError.message || '';
        if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
          toast({
            title: "Too Many Requests",
            description: "Please wait a moment and try again.",
            variant: "destructive"
          });
        } else if (errorMessage.includes('credits') || errorMessage.includes('402')) {
          toast({
            title: "Credits Depleted",
            description: "AI credits are depleted. Please add credits in Settings.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Generation Failed",
            description: "Failed to generate test. Please try again.",
            variant: "destructive"
          });
        }
        return;
      }

      if (!aiResponse?.questions?.length) {
        toast({
          title: "Generation Failed",
          description: "AI generated an invalid response. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Save to database
      const { data: sessionData, error: dbError } = await supabase
        .from('custom_test_sessions')
        .insert({
          user_id: user.id,
          session_name: syllabusName,
          question_count: quizSettings.questionsCount,
          time_limit: quizSettings.timeLimit,
          difficulty_levels: [quizSettings.difficulty],
          questions: aiResponse.questions,
          subjects: selectedSubjects.map(s => s.name),
          topics: selectedSubjects.map(subject => ({
            subject: subject.name,
            topics: subject.topics.filter(t => t.isSelected).map(t => t.name)
          }))
        })
        .select()
        .single();

      if (dbError) {
        toast({
          title: "Save Failed",
          description: "Failed to save your test. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Test Created!",
        description: `${aiResponse.questions.length} questions ready`,
      });

      navigate(`/test-session/${sessionData.id}`, { state: { returnPath: '/custom-syllabus' } });
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pt-4 pb-24 lg:pb-10">
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
        {/* Left Sidebar - Filters */}
        <div className="lg:col-span-1">
          <Card className="p-4 sticky top-20">
            <FilterSidebar
              systems={systems}
              availableLevels={availableLevels}
              filterState={filterState}
              toggleSystemFilter={toggleSystemFilter}
              toggleLevelFilter={toggleLevelFilter}
              clearFilters={clearFilters}
            />
          </Card>
        </div>

        {/* Center - Subject Grid */}
        <div className="lg:col-span-2 space-y-3">
          {/* Smart Search Bar */}
          <SmartSearchInput
            placeholder="Search subjects or topics..."
            onSelect={handleSmartSearchSelect}
          />

          {/* Subject Cards */}
          <SubjectGrid
            subjects={filteredSubjects}
            loading={loading}
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
