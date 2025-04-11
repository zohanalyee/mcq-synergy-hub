
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Clock, Award, BarChart2, BookOpen, 
  ArrowDown, ArrowUp, SlidersHorizontal 
} from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { subjects } from "@/pages/Subjects";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { 
  getTopicsForSubject, 
  getRandomTopics 
} from "@/utils/mockTestUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Mock tests data with multiple subject categories
const mockTests = [
  {
    id: 1,
    title: "General Mathematics Test",
    description: "A comprehensive test covering algebra, geometry, and calculus",
    duration: 60,
    questions: 50,
    difficulty: "Medium",
    category: "Mathematics",
    topics: ["Algebra", "Geometry", "Calculus"]
  },
  {
    id: 2,
    title: "Computer Science Fundamentals",
    description: "Test your knowledge of programming, data structures, and algorithms",
    duration: 45,
    questions: 40,
    difficulty: "Hard",
    category: "Computer Science",
    topics: ["Programming", "Data Structures", "Algorithms"]
  },
  {
    id: 3,
    title: "Basic Physics Concepts",
    description: "Questions on mechanics, thermodynamics, and electromagnetics",
    duration: 50,
    questions: 45,
    difficulty: "Medium",
    category: "Physics",
    topics: ["Mechanics", "Thermodynamics", "Electromagnetics"]
  },
  {
    id: 4,
    title: "Chemistry Principles",
    description: "Test covering organic, inorganic chemistry and chemical bonding",
    duration: 40,
    questions: 35,
    difficulty: "Easy",
    category: "Chemistry",
    topics: ["Organic Chemistry", "Inorganic Chemistry", "Chemical Bonding"]
  },
  {
    id: 5,
    title: "Biology Essentials",
    description: "Covers cellular biology, genetics, and human anatomy",
    duration: 55,
    questions: 45,
    difficulty: "Medium",
    category: "Biology",
    topics: ["Cellular Biology", "Genetics", "Human Anatomy"]
  },
  {
    id: 6,
    title: "English Proficiency",
    description: "Grammar, vocabulary, and reading comprehension test",
    duration: 35,
    questions: 30,
    difficulty: "Easy",
    category: "English",
    topics: ["Grammar", "Vocabulary", "Reading Comprehension"]
  }
];

// Schema for test customization
const testCustomizationSchema = z.object({
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  questionCount: z.coerce.number().min(5).max(100),
  duration: z.coerce.number().min(5).max(180),
});

// Generate more mock tests based on all available subjects
const generateAllMockTests = () => {
  // Start with existing mock tests
  const allTests = [...mockTests];
  
  // Find subjects that don't have a mock test yet
  const existingCategories = mockTests.map(test => test.category);
  const subjectsWithoutTests = subjects.filter(
    subject => !existingCategories.includes(subject.title)
  );
  
  // Create mock tests for remaining subjects
  let nextId = mockTests.length + 1;
  const difficulties = ["Easy", "Medium", "Hard"];
  
  const newTests = subjectsWithoutTests.map(subject => {
    const randomDuration = Math.floor(Math.random() * 30) + 30; // 30-60 mins
    const randomQuestions = Math.floor(Math.random() * 20) + 30; // 30-50 questions
    const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    const randomTopics = getRandomTopics(subject.title, 3);
    
    return {
      id: nextId++,
      title: `${subject.title} Assessment`,
      description: `Comprehensive test covering core concepts in ${subject.title}`,
      duration: randomDuration,
      questions: randomQuestions,
      difficulty: randomDifficulty,
      category: subject.title,
      topics: randomTopics
    };
  });
  
  return [...allTests, ...newTests];
};

const MockTests = () => {
  const [filter, setFilter] = useState("all");
  const [allMockTests, setAllMockTests] = useState<typeof mockTests>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedTest, setExpandedTest] = useState<number | null>(null);
  const [customizeTest, setCustomizeTest] = useState<number | null>(null);
  const navigate = useNavigate();
  
  const form = useForm({
    resolver: zodResolver(testCustomizationSchema),
    defaultValues: {
      difficulty: "Medium",
      questionCount: 30,
      duration: 45,
    },
  });
  
  useEffect(() => {
    // Generate mock tests for all subjects
    setAllMockTests(generateAllMockTests());
    setIsLoaded(true);
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "text-green-500";
      case "Medium": return "text-amber-500";
      case "Hard": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  const filteredTests = filter === "all" 
    ? allMockTests 
    : allMockTests.filter(test => test.category.toLowerCase() === filter.toLowerCase());

  // Get unique categories from all mock tests
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
    
    // For now just show a success message, in a real app we would navigate to the test page
    console.log(`Starting test: ${test.title}`, settings);
  };

  const toggleExpandTest = (testId: number) => {
    if (expandedTest === testId) {
      setExpandedTest(null);
    } else {
      setExpandedTest(testId);
      setCustomizeTest(null); // Close any open customize panel
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

  const handleSubmitCustomization = (testId: number, data: z.infer<typeof testCustomizationSchema>) => {
    const test = allMockTests.find(test => test.id === testId);
    if (test) {
      handleStartTest(test, data);
    }
    setCustomizeTest(null);
  };

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const breadcrumbItems = [
    { title: "Home", href: "/" },
    { title: "Mock Tests", href: "/mock-tests", isCurrent: true },
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
          <p className="text-muted-foreground">Practice with our collection of subject-specific mock tests</p>
        </motion.div>

        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex space-x-2 min-w-max">
            {isLoaded && getCategories().map((category) => (
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
          {filteredTests.map((test) => (
            <motion.div key={test.id} variants={item}>
              <Card className="h-full hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold">{test.title}</h3>
                    <span className={`text-sm font-medium ${getDifficultyColor(test.difficulty)}`}>
                      {test.difficulty}
                    </span>
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
                      <Button 
                        variant="outline" 
                        className="flex items-center w-1/2 justify-center"
                        onClick={() => toggleExpandTest(test.id)}
                      >
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
                    
                    {/* Topics Display */}
                    {expandedTest === test.id && (
                      <motion.div 
                        className="border rounded-lg p-3 bg-secondary/20"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <h4 className="text-sm font-medium mb-2">Topics:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {test.topics.map((topic, index) => (
                            <li key={index} className="text-sm">{topic}</li>
                          ))}
                        </ul>
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
                          <form onSubmit={form.handleSubmit((data) => handleSubmitCustomization(test.id, data))} className="space-y-3">
                            <FormField
                              control={form.control}
                              name="difficulty"
                              render={({ field }) => (
                                <FormItem className="space-y-1">
                                  <FormLabel className="text-sm">Difficulty</FormLabel>
                                  <FormControl>
                                    <RadioGroup
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                      className="flex space-x-4"
                                    >
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
                                      <Input
                                        type="number"
                                        min={5}
                                        max={100}
                                        {...field}
                                      />
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
                                      <Input
                                        type="number"
                                        min={5}
                                        max={180}
                                        {...field}
                                      />
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
                      <Button 
                        className="w-full"
                        onClick={() => handleStartTest(test)}
                      >
                        Start Test
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </>
  );
};

export default MockTests;
