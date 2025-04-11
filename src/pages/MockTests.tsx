import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Award, BarChart2, BookOpen, ArrowDown, ArrowUp, SlidersHorizontal, Check, Briefcase, GraduationCap, Building } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { subjects } from "@/pages/Subjects";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getTopicsForSubject, getRandomTopics } from "@/utils/mockTestUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { jobTests, SyllabusItem } from "@/data/jobTestsData";

const mockTests = [
  // ... keep existing code (mockTests array content)
];

const testCustomizationSchema = z.object({
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  questionCount: z.coerce.number().min(5).max(100),
  duration: z.coerce.number().min(5).max(180)
});

const generateAllMockTests = () => {
  // ... keep existing code (generateAllMockTests function content)
};

const MockTests = () => {
  const [filter, setFilter] = useState("all");
  const [allMockTests, setAllMockTests] = useState<typeof mockTests>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedTest, setExpandedTest] = useState<number | null>(null);
  const [expandedJobTest, setExpandedJobTest] = useState<number | null>(null);
  const [customizeTest, setCustomizeTest] = useState<number | null>(null);
  const [customizeJobTest, setCustomizeJobTest] = useState<number | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<Record<number, string[]>>({});
  const [activeTab, setActiveTab] = useState("subjects");
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(testCustomizationSchema),
    defaultValues: {
      difficulty: "Medium" as const,
      questionCount: 30,
      duration: 45
    }
  });

  const jobTestForm = useForm({
    resolver: zodResolver(testCustomizationSchema),
    defaultValues: {
      difficulty: "Medium" as const,
      questionCount: 50,
      duration: 90
    }
  });

  useEffect(() => {
    // Generate mock tests for all subjects
    setAllMockTests(generateAllMockTests());
    setIsLoaded(true);
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "text-green-500";
      case "Medium":
        return "text-amber-500";
      case "Hard":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const filteredTests = filter === "all" ? allMockTests : allMockTests.filter(test => test.category.toLowerCase() === filter.toLowerCase());

  const getCategories = () => {
    const categories = allMockTests.map(test => test.category);
    return ["all", ...Array.from(new Set(categories))];
  };

  const handleStartTest = (test: any, customSettings?: any) => {
    const settings = customSettings || {
      difficulty: test.difficulty,
      questionCount: test.questions,
      duration: test.duration
    };

    toast.success(`Starting ${test.title}`, {
      description: `${settings.questionCount} questions • ${settings.duration} minutes • ${settings.difficulty} difficulty`
    });

    console.log(`Starting test: ${test.title}`, {
      ...settings,
      topics: test.topics
    });
  };

  const handleStartJobTest = (test: any, customSettings?: any) => {
    const settings = customSettings || {
      difficulty: test.difficulty || "Medium",
      questionCount: test.questions,
      duration: test.duration
    };
    
    toast.success(`Starting ${test.title}`, {
      description: `${settings.questionCount} questions • ${settings.duration} minutes • Official Test`
    });

    console.log(`Starting job test: ${test.title}`, {
      ...settings,
      syllabus: test.syllabus
    });
  };

  const toggleExpandTest = (testId: number) => {
    if (expandedTest === testId) {
      setExpandedTest(null);
    } else {
      setExpandedTest(testId);
      setCustomizeTest(null); // Close any open customize panel

      const test = allMockTests.find(t => t.id === testId);
      if (test && !selectedTopics[testId]) {
        setSelectedTopics(prev => ({
          ...prev,
          [testId]: [...test.topics]
        }));
      }
    }
  };

  const toggleExpandJobTest = (testId: number) => {
    if (expandedJobTest === testId) {
      setExpandedJobTest(null);
    } else {
      setExpandedJobTest(testId);
      setCustomizeJobTest(null); // Close any open customize panel
    }
  };

  const toggleCustomizeTest = (testId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (customizeTest === testId) {
      setCustomizeTest(null);
    } else {
      setCustomizeTest(testId);
      setExpandedTest(null); // Close any open topic panel
    }
  };

  const toggleCustomizeJobTest = (testId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (customizeJobTest === testId) {
      setCustomizeJobTest(null);
    } else {
      setCustomizeJobTest(testId);
      setExpandedJobTest(null); // Close any open syllabus panel
    }
  };

  const handleTopicToggle = (testId: number, topic: string) => {
    setSelectedTopics(prev => {
      const currentTopics = prev[testId] || [];
      if (currentTopics.includes(topic)) {
        if (currentTopics.length === 1) {
          return prev;
        }
        return {
          ...prev,
          [testId]: currentTopics.filter(t => t !== topic)
        };
      } else {
        return {
          ...prev,
          [testId]: [...currentTopics, topic]
        };
      }
    });
  };

  const isTopicSelected = (testId: number, topic: string) => {
    return (selectedTopics[testId] || []).includes(topic);
  };

  const handleSubmitCustomization = (testId: number, data: z.infer<typeof testCustomizationSchema>) => {
    const test = allMockTests.find(test => test.id === testId);
    if (test) {
      handleStartTest(test, data);
    }
    setCustomizeTest(null);
  };

  const handleSubmitJobCustomization = (testId: number, data: z.infer<typeof testCustomizationSchema>) => {
    const test = jobTests.find(test => test.id === testId);
    if (test) {
      handleStartJobTest(test, data);
    }
    setCustomizeJobTest(null);
  };

  const container = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: {
      y: 20,
      opacity: 0
    },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  const breadcrumbItems = [
    { title: "Home", href: "/" },
    { title: "Mock Tests", href: "/mock-tests", isCurrent: true }
  ];

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-16">
        <PageBreadcrumb items={breadcrumbItems} />
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }} 
          className="mb-8"
        >
          <h1 className="text-3xl font-bold">Mock Tests</h1>
          <p className="text-muted-foreground">Practice with our collection of subject-specific and official job tests</p>
        </motion.div>

        <Tabs defaultValue="subjects" className="mb-8" onValueChange={(value) => setActiveTab(value)}>
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="subjects">Subject-wise Tests</TabsTrigger>
            <TabsTrigger value="jobs">Job/Post Tests</TabsTrigger>
          </TabsList>
          
          <TabsContent value="subjects">
            <div className="mb-8 overflow-x-auto pb-2">
              <div className="flex space-x-2 min-w-max">
                {isLoaded && getCategories().map(category => (
                  <Button 
                    key={category} 
                    variant={filter === category ? "default" : "outline"} 
                    onClick={() => setFilter(category)} 
                    size="sm" 
                    className="capitalize"
                  >
                    {category === "all" ? "All" : category}
                  </Button>
                ))}
              </div>
            </div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              variants={container} 
              initial="hidden" 
              animate={isLoaded ? "visible" : "hidden"}
            >
              {filteredTests.map(test => (
                <motion.div key={test.id} variants={item}>
                  <Card className="h-full hover:shadow-md transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold">{test.title}</h3>
                      </div>
                      
                      <p className="text-muted-foreground text-sm mb-6">{test.description}</p>
                      
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{test.duration} mins</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span>{test.questions} questions</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span>Certification</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <BarChart2 className="h-4 w-4 text-muted-foreground" />
                          <span>Detailed analysis</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                          <Button variant="outline" className="flex items-center w-1/2 justify-center" onClick={() => toggleExpandTest(test.id)}>
                            {expandedTest === test.id ? (
                              <>Hide Topics <ArrowUp className="ml-2 h-4 w-4" /></>
                            ) : (
                              <>Show Topics <ArrowDown className="ml-2 h-4 w-4" /></>
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex items-center w-1/2 ml-2 justify-center" 
                            onClick={(e) => toggleCustomizeTest(test.id, e)}
                          >
                            <SlidersHorizontal className="mr-2 h-4 w-4" /> Customize
                          </Button>
                        </div>
                        
                        {/* Topics Display with Selection */}
                        {expandedTest === test.id && (
                          <motion.div
                            className="border rounded-lg p-3 bg-secondary/20"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <h4 className="text-sm font-medium mb-2">Select topics to include:</h4>
                            <div className="space-y-2">
                              {test.topics.map((topic, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`topic-${test.id}-${index}`} 
                                    checked={isTopicSelected(test.id, topic)} 
                                    onCheckedChange={() => handleTopicToggle(test.id, topic)} 
                                    disabled={isTopicSelected(test.id, topic) && (selectedTopics[test.id]?.length || 0) <= 1} 
                                  />
                                  <label htmlFor={`topic-${test.id}-${index}`} className="text-sm cursor-pointer">
                                    {topic}
                                  </label>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3">
                              <p className="text-xs text-muted-foreground">At least one topic must be selected.</p>
                            </div>
                          </motion.div>
                        )}
                        
                        {/* Customize Test Form */}
                        {customizeTest === test.id && (
                          <motion.div
                            className="border rounded-lg p-3"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <Form {...form}>
                              <form onSubmit={form.handleSubmit(data => handleSubmitCustomization(test.id, data))} className="space-y-3">
                                <FormField 
                                  control={form.control} 
                                  name="difficulty" 
                                  render={({ field }) => (
                                    <FormItem className="space-y-1">
                                      <FormLabel className="text-sm">Difficulty</FormLabel>
                                      <FormControl>
                                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                          <div className="flex items-center space-x-1">
                                            <RadioGroupItem value="Easy" id={`easy-${test.id}`} />
                                            <FormLabel htmlFor={`easy-${test.id}`} className="text-green-500 text-sm">Easy</FormLabel>
                                          </div>
                                          <div className="flex items-center space-x-1">
                                            <RadioGroupItem value="Medium" id={`medium-${test.id}`} />
                                            <FormLabel htmlFor={`medium-${test.id}`} className="text-amber-500 text-sm">Medium</FormLabel>
                                          </div>
                                          <div className="flex items-center space-x-1">
                                            <RadioGroupItem value="Hard" id={`hard-${test.id}`} />
                                            <FormLabel htmlFor={`hard-${test.id}`} className="text-red-500 text-sm">Hard</FormLabel>
                                          </div>
                                        </RadioGroup>
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                  <FormField 
                                    control={form.control} 
                                    name="questionCount" 
                                    render={({ field }) => (
                                      <FormItem className="space-y-1">
                                        <FormLabel className="text-sm">Questions</FormLabel>
                                        <FormControl>
                                          <Input type="number" min={5} max={100} {...field} />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                  <FormField 
                                    control={form.control} 
                                    name="duration" 
                                    render={({ field }) => (
                                      <FormItem className="space-y-1">
                                        <FormLabel className="text-sm">Duration (mins)</FormLabel>
                                        <FormControl>
                                          <Input type="number" min={5} max={180} {...field} />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <Button type="submit" size="sm" className="w-full">
                                  Start Custom Test
                                </Button>
                              </form>
                            </Form>
                          </motion.div>
                        )}
                        
                        {/* Start Test Button */}
                        {!customizeTest && (
                          <Button className="w-full" onClick={() => handleStartTest(test)}>
                            Start Test
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
          
          <TabsContent value="jobs">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              variants={container} 
              initial="hidden" 
              animate={isLoaded ? "visible" : "hidden"}
            >
              {jobTests.map(test => (
                <motion.div key={test.id} variants={item}>
                  <Card className="h-full hover:shadow-md transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-semibold">{test.title}</h3>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Building className="h-4 w-4" />
                        <span>{test.organization}</span>
                      </div>
                      
                      <p className="text-muted-foreground text-sm mb-6">{test.description}</p>
                      
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{test.duration} mins</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span>{test.questions} questions</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <span>Official Syllabus</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span>Job Preparation</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                          <Button variant="outline" className="flex items-center w-1/2 justify-center" onClick={() => toggleExpandJobTest(test.id)}>
                            {expandedJobTest === test.id ? (
                              <>Hide Syllabus <ArrowUp className="ml-2 h-4 w-4" /></>
                            ) : (
                              <>Show Syllabus <ArrowDown className="ml-2 h-4 w-4" /></>
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex items-center w-1/2 ml-2 justify-center" 
                            onClick={(e) => toggleCustomizeJobTest(test.id, e)}
                          >
                            <SlidersHorizontal className="mr-2 h-4 w-4" /> Customize
                          </Button>
                        </div>
                        
                        {/* Syllabus Display */}
                        {expandedJobTest === test.id && (
                          <motion.div
                            className="border rounded-lg p-3 bg-secondary/20"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <h4 className="text-sm font-medium mb-2">Official Test Syllabus:</h4>
                            <div className="space-y-2">
                              {test.syllabus.map((item: SyllabusItem, index: number) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                  <span>{item.topic}</span>
                                  <span className="font-medium">{item.percentage}%</span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3">
                              <p className="text-xs text-muted-foreground">Percentages indicate exam weightage.</p>
                            </div>
                          </motion.div>
                        )}
                        
                        {/* Customize Job Test Form */}
                        {customizeJobTest === test.id && (
                          <motion.div
                            className="border rounded-lg p-3"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <Form {...jobTestForm}>
                              <form onSubmit={jobTestForm.handleSubmit(data => handleSubmitJobCustomization(test.id, data))} className="space-y-3">
                                <FormField 
                                  control={jobTestForm.control} 
                                  name="difficulty" 
                                  render={({ field }) => (
                                    <FormItem className="space-y-1">
                                      <FormLabel className="text-sm">Difficulty</FormLabel>
                                      <FormControl>
                                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                          <div className="flex items-center space-x-1">
                                            <RadioGroupItem value="Easy" id={`job-easy-${test.id}`} />
                                            <FormLabel htmlFor={`job-easy-${test.id}`} className="text-green-500 text-sm">Easy</FormLabel>
                                          </div>
                                          <div className="flex items-center space-x-1">
                                            <RadioGroupItem value="Medium" id={`job-medium-${test.id}`} />
                                            <FormLabel htmlFor={`job-medium-${test.id}`} className="text-amber-500 text-sm">Medium</FormLabel>
                                          </div>
                                          <div className="flex items-center space-x-1">
                                            <RadioGroupItem value="Hard" id={`job-hard-${test.id}`} />
                                            <FormLabel htmlFor={`job-hard-${test.id}`} className="text-red-500 text-sm">Hard</FormLabel>
                                          </div>
                                        </RadioGroup>
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                  <FormField 
                                    control={jobTestForm.control} 
                                    name="questionCount" 
                                    render={({ field }) => (
                                      <FormItem className="space-y-1">
                                        <FormLabel className="text-sm">Questions</FormLabel>
                                        <FormControl>
                                          <Input type="number" min={5} max={200} {...field} />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                  <FormField 
                                    control={jobTestForm.control} 
                                    name="duration" 
                                    render={({ field }) => (
                                      <FormItem className="space-y-1">
                                        <FormLabel className="text-sm">Duration (mins)</FormLabel>
                                        <FormControl>
                                          <Input type="number" min={5} max={240} {...field} />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <Button type="submit" size="sm" className="w-full">
                                  Start Custom Test
                                </Button>
                              </form>
                            </Form>
                          </motion.div>
                        )}
                        
                        {/* Start Test Button */}
                        {!customizeJobTest && (
                          <Button className="w-full" onClick={() => handleStartJobTest(test)}>
                            Start Test
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default MockTests;
