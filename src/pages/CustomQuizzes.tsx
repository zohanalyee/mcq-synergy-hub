import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Badge } from "@/components/ui/badge";
import { subjects } from "@/data/subjectsData";
import { CustomSubject, QuizSettings } from "@/components/custom-quizzes/interfaces";
import SubjectList from "@/components/custom-quizzes/SubjectList";
import QuizConfigPanel from "@/components/custom-quizzes/QuizConfigPanel";
import { generateTopicsForSubject } from "@/components/custom-syllabus/utils";

const CustomQuizzes = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [customSubjects, setCustomSubjects] = useState<CustomSubject[]>([]);
  const [quizName, setQuizName] = useState("My Custom Quiz");
  const [selectedTopicsCount, setSelectedTopicsCount] = useState(0);
  const [selectedSubjectsCount, setSelectedSubjectsCount] = useState(0);
  const [quizSettings, setQuizSettings] = useState<QuizSettings>({
    timeLimit: 15,
    questionsCount: 10,
    difficulty: "medium",
    quizType: "practice"
  });
  
  useEffect(() => {
    setIsLoaded(true);
    
    // Initialize custom subjects with topics
    const initialCustomSubjects: CustomSubject[] = subjects.map(subject => ({
      ...subject,
      expanded: false,
      selected: false,
      topics: generateTopicsForSubject(subject.title, subject.topicCount)
    }));
    
    setCustomSubjects(initialCustomSubjects);
  }, []);

  useEffect(() => {
    let topicsCount = 0;
    let subjectsCount = 0;
    
    customSubjects.forEach(subject => {
      const selectedTopicsInSubject = subject.topics.filter(topic => topic.selected).length;
      if (selectedTopicsInSubject > 0) {
        subjectsCount++;
        topicsCount += selectedTopicsInSubject;
      }
    });
    
    setSelectedTopicsCount(topicsCount);
    setSelectedSubjectsCount(subjectsCount);
  }, [customSubjects]);

  const toggleSubjectSelection = (subjectTitle: string) => {
    setCustomSubjects(prev => prev.map(subject => {
      if (subject.title === subjectTitle) {
        const newSelectedState = !subject.selected;
        return {
          ...subject,
          selected: newSelectedState,
          topics: subject.topics.map(topic => ({
            ...topic,
            selected: newSelectedState
          }))
        };
      }
      return subject;
    }));
  };

  const toggleTopicSelection = (subjectTitle: string, topicId: string) => {
    setCustomSubjects(prev => prev.map(subject => {
      if (subject.title === subjectTitle) {
        return {
          ...subject,
          topics: subject.topics.map(topic => {
            if (topic.id === topicId) {
              return { ...topic, selected: !topic.selected };
            }
            return topic;
          }),
          selected: subject.selected || subject.topics.some(t => t.id === topicId && !t.selected)
        };
      }
      return subject;
    }));
  };

  const toggleSubjectExpansion = (subjectTitle: string) => {
    setCustomSubjects(prev => prev.map(subject => {
      if (subject.title === subjectTitle) {
        return { ...subject, expanded: !subject.expanded };
      }
      return subject;
    }));
  };

  const updateQuizSettings = (setting: keyof QuizSettings, value: any) => {
    setQuizSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  // For the Type error on getCategories function
  // Fix the categories computation
  const categories = (() => {
    const cats = subjects.map(subject => subject.category);
    return ["All", ...Array.from(new Set(cats))];
  })();

  const breadcrumbItems = [
    { title: "Home", href: "/" },
    { title: "Custom Quizzes", href: "/custom-quizzes", isCurrent: true },
  ];

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-16 max-w-7xl">
        <PageBreadcrumb items={breadcrumbItems} />
        
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Custom Quizzes</h1>
              <p className="text-muted-foreground max-w-2xl">
                Create personalized quizzes by selecting subjects and topics. Choose the quiz type, 
                difficulty level, and customize your learning experience.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="px-3 py-1.5">
                <span className="text-primary font-semibold text-lg mr-1.5">{selectedSubjectsCount}</span> Subjects
              </Badge>
              <Badge variant="outline" className="px-3 py-1.5">
                <span className="text-primary font-semibold text-lg mr-1.5">{selectedTopicsCount}</span> Topics
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SubjectList 
                customSubjects={customSubjects}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                categories={categories}
                toggleSubjectSelection={toggleSubjectSelection}
                toggleTopicSelection={toggleTopicSelection}
                toggleSubjectExpansion={toggleSubjectExpansion}
              />
            </div>
            
            <div>
              <div className="sticky top-28 space-y-6">
                <QuizConfigPanel
                  quizName={quizName}
                  setQuizName={setQuizName}
                  selectedTopicsCount={selectedTopicsCount}
                  selectedSubjectsCount={selectedSubjectsCount}
                  quizSettings={quizSettings}
                  updateQuizSettings={updateQuizSettings}
                  customSubjects={customSubjects}
                  setSelectedCategory={setSelectedCategory}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default CustomQuizzes;
