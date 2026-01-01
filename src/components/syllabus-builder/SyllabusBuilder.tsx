import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

import { useSyllabusData } from './hooks/useSyllabusData';
import { FilterSidebar } from './FilterSidebar';
import { SubjectGrid } from './SubjectGrid';
import { SelectionSummary } from './SelectionSummary';
import { SyllabusSubject, QuizSettings } from './interfaces';

export const SyllabusBuilder = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [syllabusName, setSyllabusName] = useState('My Custom Quiz');
  const [isGenerating, setIsGenerating] = useState(false);
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
    clearFilters
  } = useSyllabusData();

  // Calculate selection counts
  const { selectedSubjectsCount, selectedTopicsCount } = useMemo(() => {
    let subjectsCount = 0;
    let topicsCount = 0;
    
    rawSubjects.forEach(subject => {
      const selectedTopics = subject.topics.filter(t => t.isSelected).length;
      if (selectedTopics > 0) {
        subjectsCount++;
        topicsCount += selectedTopics;
      }
    });

    return { selectedSubjectsCount: subjectsCount, selectedTopicsCount: topicsCount };
  }, [rawSubjects]);

  // Toggle subject selection (select/deselect all topics)
  const handleToggleSubject = useCallback((subjectId: string) => {
    setRawSubjects(prev => prev.map(subject => {
      if (subject.id === subjectId) {
        const allSelected = subject.topics.every(t => t.isSelected);
        return {
          ...subject,
          isSelected: !allSelected,
          topics: subject.topics.map(t => ({ ...t, isSelected: !allSelected }))
        };
      }
      return subject;
    }));
  }, [setRawSubjects]);

  // Toggle individual topic selection
  const handleToggleTopic = useCallback((subjectId: string, topicId: string) => {
    setRawSubjects(prev => prev.map(subject => {
      if (subject.id === subjectId) {
        const newTopics = subject.topics.map(t => 
          t.id === topicId ? { ...t, isSelected: !t.isSelected } : t
        );
        return {
          ...subject,
          topics: newTopics,
          isSelected: newTopics.some(t => t.isSelected)
        };
      }
      return subject;
    }));
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

  // Generate quiz
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
        description: "Please select at least one topic for your quiz.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Gather selected topics
      const selectedSubjects = rawSubjects.filter(s => s.topics.some(t => t.isSelected));
      const selectedTopicsString = selectedSubjects
        .map(subject => {
          const topics = subject.topics.filter(t => t.isSelected).map(t => t.name).join(', ');
          return `${subject.name}: ${topics}`;
        })
        .join('; ');

      const usePartialMode = quizSettings.questionsCount > 20;

      // Call AI to generate test
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('generate-test', {
        body: {
          topic: selectedTopicsString,
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
            description: "Failed to generate quiz. Please try again.",
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
          description: "Failed to save your quiz. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Quiz Created!",
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
          Select subjects and topics from your syllabus to create a personalized quiz
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Badge variant="secondary" className="px-2 py-1 text-xs">
            <span className="text-primary font-bold mr-1">{selectedSubjectsCount}</span> Subjects
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
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subjects or topics..."
              value={filterState.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

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
            {isGenerating ? 'Generating...' : `Generate Quiz (${selectedTopicsCount} Topics)`}
          </Button>
        </div>
      )}
    </div>
  );
};
