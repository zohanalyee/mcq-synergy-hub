import { useState, useRef, useEffect } from "react";
import { 
  Book, Code, Beaker, Brain, Atom, Calculator, Scale, Landmark, Globe, 
  Dumbbell, BarChart, DollarSign, Users, ShoppingCart, ScrollText, 
  FileCheck, Zap, Building, Wrench, Cpu, Stethoscope, Microscope, Plus
} from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

// Import subjects data
import { subjects } from "@/data/subjectsData";

// Import custom components
import { CustomSubject, QuizSettings } from "@/components/custom-syllabus/interfaces";
import EnhancedSubjectFilter from "@/components/custom-syllabus/EnhancedSubjectFilter";
import SubjectCard from "@/components/custom-syllabus/SubjectCard";
import QuizPanel from "@/components/custom-syllabus/QuizPanel";
import { generateTopicsForSubject, getCategories } from "@/components/custom-syllabus/utils";

const CustomSyllabus = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [customSubjects, setCustomSubjects] = useState<CustomSubject[]>([]);
  const [syllabusName, setSyllabusName] = useState("My Custom Syllabus");
  const [selectedTopicsCount, setSelectedTopicsCount] = useState(0);
  const [selectedSubjectsCount, setSelectedSubjectsCount] = useState(0);
  const [activeTab, setActiveTab] = useState("topics");
  const [quizSettings, setQuizSettings] = useState<QuizSettings>({
    timeLimit: 30,
    questionsCount: 20,
    difficulty: "medium"
  });
  
  const navigate = useNavigate();
  const selectedTopicsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoaded(true);
    
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

  const createQuiz = () => {
    if (selectedTopicsCount === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one topic for your custom quiz.",
        variant: "destructive"
      });
      return;
    }

    const selectedSyllabusData = {
      name: syllabusName,
      topics: customSubjects
        .filter(subject => subject.topics.some(topic => topic.selected))
        .map(subject => ({
          subject: subject.title,
          topics: subject.topics.filter(topic => topic.selected).map(t => t.name)
        })),
      settings: quizSettings
    };

    console.log("Creating quiz with data:", selectedSyllabusData);

    toast({
      title: "Quiz Created!",
      description: `Your custom quiz "${syllabusName}" with ${selectedTopicsCount} topics and ${quizSettings.questionsCount} questions is ready.`,
    });

    navigate('/mock-tests');
  };

  const scrollToSelectedTopics = () => {
    selectedTopicsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredSubjects = customSubjects.filter(subject => {
    const categoryMatch = selectedCategory === "All" || subject.category === selectedCategory;
    const searchMatch = subject.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       subject.topics.some(topic => topic.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return categoryMatch && searchMatch;
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  const breadcrumbItems = [
    { title: "Home", href: "/" },
    { title: "Custom Syllabus", href: "/custom-syllabus", isCurrent: true },
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
              <h1 className="text-4xl font-bold mb-2">Custom Syllabus Builder</h1>
              <p className="text-muted-foreground max-w-2xl">
                Create your personalized test syllabus by selecting specific topics from various subjects.
                Choose exactly what you want to study and test yourself on.
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
            <div className="lg:col-span-2 space-y-6" ref={selectedTopicsRef}>
              <div className="sticky top-28 space-y-6">
                <QuizPanel
                  syllabusName={syllabusName}
                  setSyllabusName={setSyllabusName}
                  selectedTopicsCount={selectedTopicsCount}
                  selectedSubjectsCount={selectedSubjectsCount}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  quizSettings={quizSettings}
                  updateQuizSettings={updateQuizSettings}
                  createQuiz={createQuiz}
                  customSubjects={customSubjects}
                  setSelectedCategory={setSelectedCategory}
                />
                
                {selectedTopicsCount > 0 && (
                  <div className="fixed bottom-6 right-6 md:hidden">
                    <Button onClick={scrollToSelectedTopics}>
                      Review Selection ({selectedTopicsCount})
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="lg:col-span-1 space-y-6">
              <EnhancedSubjectFilter
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                categories={getCategories(subjects)}
              />

              <motion.div
                variants={container}
                initial="hidden"
                animate={isLoaded ? "show" : "hidden"}
                className="space-y-4 max-h-[600px] overflow-y-auto"
              >
                {filteredSubjects.length > 0 ? (
                  filteredSubjects.map((subject) => (
                    <motion.div key={subject.title} variants={item}>
                      <SubjectCard
                        subject={subject}
                        toggleSubjectSelection={toggleSubjectSelection}
                        toggleTopicSelection={toggleTopicSelection}
                        toggleSubjectExpansion={toggleSubjectExpansion}
                      />
                    </motion.div>
                  ))
                ) : (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground mb-4">No subjects or topics match your search criteria.</p>
                    <Button onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All");
                    }}>Clear Filters</Button>
                  </Card>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default CustomSyllabus;
