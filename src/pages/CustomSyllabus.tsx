import { useState, useRef, useEffect } from "react";
import * as React from "react";
import { 
  Book, Code, Beaker, Brain, Atom, Calculator, Scale, Landmark, Globe, 
  Dumbbell, BarChart, DollarSign, Users, ShoppingCart, ScrollText, 
  FileCheck, Zap, Building, Wrench, Cpu, Stethoscope, Microscope,
  ChevronDown, ChevronRight, Check, Plus, ListChecks, Timer, BookOpen, 
  FileQuestion, Settings
} from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import subjects data
import { subjects } from "./Subjects";

interface Topic {
  id: string;
  name: string;
  selected: boolean;
}

interface CustomSubject {
  title: string;
  icon: React.ReactNode;
  category: string;
  topics: Topic[];
  expanded: boolean;
  selected: boolean;
  color: string;
  topicCount: number;
}

interface QuizSettings {
  timeLimit: number; // in minutes
  questionsCount: number;
  difficulty: "easy" | "medium" | "hard" | "mixed";
}

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

  const generateTopicsForSubject = (subjectTitle: string, count: number): Topic[] => {
    const subjectTopicMap: Record<string, string[]> = {
      "Mathematics": [
        "Algebra", "Calculus", "Geometry", "Trigonometry", "Statistics", 
        "Linear Algebra", "Number Theory", "Discrete Mathematics", 
        "Mathematical Logic", "Differential Equations", "Complex Analysis",
        "Probability Theory"
      ],
      "Computer Science": [
        "Data Structures", "Algorithms", "Object-Oriented Programming", 
        "Database Systems", "Computer Networks", "Operating Systems", 
        "Software Engineering", "Web Development", "Machine Learning", 
        "Computer Architecture"
      ],
      "Physics": [
        "Mechanics", "Electromagnetism", "Thermodynamics", "Quantum Mechanics", 
        "Relativity", "Optics", "Nuclear Physics", "Fluid Mechanics"
      ],
      "Chemistry": [
        "Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", 
        "Biochemistry", "Analytical Chemistry", "Environmental Chemistry", 
        "Polymer Chemistry"
      ],
      "Biology": [
        "Cell Biology", "Genetics", "Ecology", "Evolution", "Molecular Biology", 
        "Microbiology", "Physiology", "Zoology", "Botany"
      ],
      "English": [
        "Grammar", "Vocabulary", "Reading Comprehension", "Writing", 
        "Literature Analysis", "Critical Reading"
      ],
      "Psychology": [
        "Clinical Psychology", "Cognitive Psychology", "Developmental Psychology", 
        "Social Psychology", "Abnormal Psychology", "Neuropsychology", 
        "Personality Psychology", "Behavioral Psychology"
      ]
    };
    
    const specificTopics = subjectTopicMap[subjectTitle] || [];
    
    if (specificTopics.length >= count) {
      return specificTopics.slice(0, count).map((topic, i) => ({
        id: `${subjectTitle.toLowerCase().replace(/\s+/g, '-')}-topic-${i + 1}`,
        name: topic,
        selected: false
      }));
    } else {
      return Array.from({ length: count }, (_, i) => ({
        id: `${subjectTitle.toLowerCase().replace(/\s+/g, '-')}-topic-${i + 1}`,
        name: specificTopics[i] || `${subjectTitle} Topic ${i + 1}`,
        selected: false
      }));
    }
  };

  const getCategories = () => {
    const categories = subjects.map(subject => subject.category);
    return ["All", ...Array.from(new Set(categories))];
  };

  const filteredSubjects = customSubjects.filter(subject => {
    const categoryMatch = selectedCategory === "All" || subject.category === selectedCategory;
    const searchMatch = subject.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       subject.topics.some(topic => topic.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return categoryMatch && searchMatch;
  });

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

  const createSyllabus = () => {
    if (selectedTopicsCount === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one topic for your custom syllabus.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Syllabus Created!",
      description: `Your custom syllabus "${syllabusName}" with ${selectedTopicsCount} topics has been created.`,
    });
    
    navigate('/mock-tests');
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
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Input 
                      placeholder="Search subjects and topics..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-grow"
                    />
                    <div className="overflow-x-auto pb-2">
                      <div className="flex space-x-2 min-w-max">
                        {getCategories().map((category) => (
                          <Button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            variant={selectedCategory === category ? "default" : "outline"}
                            size="sm"
                            className="whitespace-nowrap"
                          >
                            {category}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <motion.div
                variants={container}
                initial="hidden"
                animate={isLoaded ? "show" : "hidden"}
                className="space-y-4"
              >
                {filteredSubjects.length > 0 ? (
                  filteredSubjects.map((subject) => (
                    <motion.div key={subject.title} variants={item}>
                      <Card>
                        <CardHeader className="p-4 pb-0">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Checkbox 
                                id={`subject-${subject.title}`}
                                checked={subject.selected}
                                onCheckedChange={() => toggleSubjectSelection(subject.title)}
                              />
                              <div className="p-2 rounded-lg" style={{ backgroundColor: `${subject.color}20` }}>
                                {subject.icon}
                              </div>
                              <CardTitle className="text-xl">{subject.title}</CardTitle>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSubjectExpansion(subject.title)}
                            >
                              {subject.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </Button>
                          </div>
                        </CardHeader>
                        
                        <Collapsible open={subject.expanded}>
                          <CollapsibleContent>
                            <CardContent className="p-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {subject.topics.map((topic) => (
                                  <div 
                                    key={topic.id} 
                                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50"
                                  >
                                    <Checkbox 
                                      id={topic.id} 
                                      checked={topic.selected}
                                      onCheckedChange={() => toggleTopicSelection(subject.title, topic.id)}
                                    />
                                    <label 
                                      htmlFor={topic.id} 
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                    >
                                      {topic.name}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
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
            
            <div ref={selectedTopicsRef}>
              <div className="sticky top-28 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Custom Quiz</CardTitle>
                    <CardDescription>Configure your quiz details</CardDescription>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="topics">Topics</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <TabsContent value="topics" className="mt-0">
                      <div>
                        <label htmlFor="syllabus-name" className="text-sm font-medium mb-1.5 block">Quiz Name</label>
                        <Input 
                          id="syllabus-name"
                          value={syllabusName} 
                          onChange={(e) => setSyllabusName(e.target.value)}
                          placeholder="Enter a name for your quiz"
                        />
                      </div>
                      
                      <div className="mt-4">
                        <h3 className="text-sm font-medium mb-1.5">Selected Content</h3>
                        <div className="bg-muted/50 rounded-lg p-4 h-[200px] overflow-y-auto">
                          {selectedSubjectsCount > 0 ? (
                            customSubjects.filter(subject => subject.topics.some(topic => topic.selected)).map(subject => (
                              <div key={subject.title} className="mb-3">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <div className="p-1 rounded-md" style={{ backgroundColor: `${subject.color}20` }}>
                                    {React.isValidElement(subject.icon) ? React.cloneElement(subject.icon, { size: 16 }) : null}
                                  </div>
                                  <span className="font-medium text-sm">{subject.title}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({subject.topics.filter(t => t.selected).length} topics)
                                  </span>
                                </div>
                                <div className="pl-7 space-y-1">
                                  {subject.topics.filter(topic => topic.selected).map(topic => (
                                    <div key={topic.id} className="flex items-center text-xs text-muted-foreground">
                                      <Check className="mr-1 h-3 w-3" />
                                      {topic.name}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                              <ListChecks className="h-10 w-10 text-muted-foreground mb-2" />
                              <p className="text-muted-foreground mb-2">No topics selected yet</p>
                              <Button variant="outline" size="sm" onClick={() => setSelectedCategory("All")}>
                                <Plus className="h-4 w-4 mr-1" /> Select Topics
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="settings" className="mt-0">
                      <div className="space-y-6">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium">Time Limit (minutes)</label>
                            <span className="text-sm text-muted-foreground">{quizSettings.timeLimit} min</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <Timer className="text-muted-foreground h-4 w-4" />
                            <Slider
                              value={[quizSettings.timeLimit]}
                              min={5}
                              max={120}
                              step={5}
                              onValueChange={(value) => updateQuizSettings('timeLimit', value[0])}
                              className="flex-1"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium">Number of Questions</label>
                            <span className="text-sm text-muted-foreground">{quizSettings.questionsCount}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <FileQuestion className="text-muted-foreground h-4 w-4" />
                            <Slider
                              value={[quizSettings.questionsCount]}
                              min={5}
                              max={50}
                              step={5}
                              onValueChange={(value) => updateQuizSettings('questionsCount', value[0])}
                              className="flex-1"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium block mb-2">Difficulty Level</label>
                          <Select
                            value={quizSettings.difficulty}
                            onValueChange={(value) => 
                              updateQuizSettings('difficulty', value as QuizSettings['difficulty'])
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                              <SelectItem value="mixed">Mixed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3">
                    <Button 
                      className="w-full" 
                      disabled={selectedTopicsCount === 0}
                      onClick={createQuiz}
                    >
                      Create Quiz & Start Test
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate('/')}
                    >
                      Cancel
                    </Button>
                  </CardFooter>
                </Card>
                
                {selectedTopicsCount > 0 && (
                  <div className="fixed bottom-6 right-6 md:hidden">
                    <Button onClick={scrollToSelectedTopics}>
                      Review Selection ({selectedTopicsCount})
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default CustomSyllabus;
