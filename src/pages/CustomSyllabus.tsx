
import { useState, useRef, useEffect } from "react";
import * as React from "react";
import { 
  Book, Code, Beaker, Brain, Atom, Calculator, Scale, Landmark, Globe, 
  Dumbbell, BarChart, DollarSign, Users, ShoppingCart, ScrollText, 
  FileCheck, Zap, Building, Wrench, Cpu, Stethoscope, Microscope,
  ChevronDown, ChevronRight, Check, Plus, ListChecks
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
  color: string; // Added color property to the interface
  topicCount: number;
}

const CustomSyllabus = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [customSubjects, setCustomSubjects] = useState<CustomSubject[]>([]);
  const [syllabusName, setSyllabusName] = useState("My Custom Syllabus");
  const [selectedTopicsCount, setSelectedTopicsCount] = useState(0);
  const [selectedSubjectsCount, setSelectedSubjectsCount] = useState(0);
  
  const navigate = useNavigate();
  
  // Ref for the selected topics section
  const selectedTopicsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoaded(true);
    
    // Initialize the custom subjects from the subjects data
    const initialCustomSubjects: CustomSubject[] = subjects.map(subject => ({
      ...subject,
      expanded: false,
      selected: false,
      topics: generateTopicsForSubject(subject.title, subject.topicCount)
    }));
    
    setCustomSubjects(initialCustomSubjects);
  }, []);

  useEffect(() => {
    // Count selected topics and subjects
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

  // Helper function to generate random topics for a subject
  const generateTopicsForSubject = (subjectTitle: string, count: number): Topic[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `${subjectTitle.toLowerCase().replace(/\s+/g, '-')}-topic-${i + 1}`,
      name: `${subjectTitle} Topic ${i + 1}`,
      selected: false
    }));
  };

  const getCategories = () => {
    const categories = subjects.map(subject => subject.category);
    return ["All", ...Array.from(new Set(categories))];
  };

  // Filter subjects based on category and search query
  const filteredSubjects = customSubjects.filter(subject => {
    const categoryMatch = selectedCategory === "All" || subject.category === selectedCategory;
    const searchMatch = subject.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       subject.topics.some(topic => topic.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return categoryMatch && searchMatch;
  });

  // Toggle subject selection
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

  // Toggle topic selection
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

  // Toggle subject expansion
  const toggleSubjectExpansion = (subjectTitle: string) => {
    setCustomSubjects(prev => prev.map(subject => {
      if (subject.title === subjectTitle) {
        return { ...subject, expanded: !subject.expanded };
      }
      return subject;
    }));
  };

  // Create custom syllabus
  const createSyllabus = () => {
    // Validate that at least one topic is selected
    if (selectedTopicsCount === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one topic for your custom syllabus.",
        variant: "destructive"
      });
      return;
    }

    // Here you would typically save the syllabus or navigate to test creation
    toast({
      title: "Syllabus Created!",
      description: `Your custom syllabus "${syllabusName}" with ${selectedTopicsCount} topics has been created.`,
    });
    
    // For demo purposes, just navigate to the mock tests page
    // In a real app, you'd save the syllabus and use it to generate a test
    navigate('/mock-tests');
  };

  // Scroll to the selected topics section
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
            {/* Left side: Subject and Topic Selection */}
            <div className="lg:col-span-2 space-y-6">
              {/* Search and Filter Section */}
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

              {/* Subject and Topic List */}
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
            
            {/* Right side: Syllabus Configuration */}
            <div ref={selectedTopicsRef}>
              <div className="sticky top-28 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Custom Syllabus</CardTitle>
                    <CardDescription>Configure your syllabus details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label htmlFor="syllabus-name" className="text-sm font-medium mb-1.5 block">Syllabus Name</label>
                      <Input 
                        id="syllabus-name"
                        value={syllabusName} 
                        onChange={(e) => setSyllabusName(e.target.value)}
                        placeholder="Enter a name for your syllabus"
                      />
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-1.5">Selected Content</h3>
                      <div className="bg-muted/50 rounded-lg p-4 h-[200px] overflow-y-auto">
                        {selectedSubjectsCount > 0 ? (
                          customSubjects.filter(subject => subject.topics.some(topic => topic.selected)).map(subject => (
                            <div key={subject.title} className="mb-3">
                              <div className="flex items-center gap-2 mb-1.5">
                                <div className="p-1 rounded-md" style={{ backgroundColor: `${subject.color}20` }}>
                                  {subject.icon && React.isValidElement(subject.icon) ? React.cloneElement(subject.icon, { size: 16 }) : null}
                                </div>
                                <span className="font-medium text-sm">{subject.title}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({subject.topics.filter(t => t.selected).length} topics)
                                </span>
                              </div>
                              <div className="pl-7 space-y-1">
                                {subject.topics.filter(topic => topic.selected).map(topic => (
                                  <div key={topic.id} className="flex items-center text-xs text-muted-foreground">
                                    <Check size={12} className="mr-1" />
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
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3">
                    <Button 
                      className="w-full" 
                      disabled={selectedTopicsCount === 0}
                      onClick={createSyllabus}
                    >
                      Create Syllabus & Start Test
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
