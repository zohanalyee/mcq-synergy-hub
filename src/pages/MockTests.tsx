
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Award, BarChart2, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { subjects } from "@/pages/Subjects";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Mock tests data with multiple subject categories
const mockTests = [
  {
    id: 1,
    title: "General Mathematics Test",
    description: "A comprehensive test covering algebra, geometry, and calculus",
    duration: 60,
    questions: 50,
    difficulty: "Medium",
    category: "Mathematics"
  },
  {
    id: 2,
    title: "Computer Science Fundamentals",
    description: "Test your knowledge of programming, data structures, and algorithms",
    duration: 45,
    questions: 40,
    difficulty: "Hard",
    category: "Computer Science"
  },
  {
    id: 3,
    title: "Basic Physics Concepts",
    description: "Questions on mechanics, thermodynamics, and electromagnetics",
    duration: 50,
    questions: 45,
    difficulty: "Medium",
    category: "Physics"
  },
  {
    id: 4,
    title: "Chemistry Principles",
    description: "Test covering organic, inorganic chemistry and chemical bonding",
    duration: 40,
    questions: 35,
    difficulty: "Easy",
    category: "Chemistry"
  },
  {
    id: 5,
    title: "Biology Essentials",
    description: "Covers cellular biology, genetics, and human anatomy",
    duration: 55,
    questions: 45,
    difficulty: "Medium",
    category: "Biology"
  },
  {
    id: 6,
    title: "English Proficiency",
    description: "Grammar, vocabulary, and reading comprehension test",
    duration: 35,
    questions: 30,
    difficulty: "Easy",
    category: "English"
  }
];

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
    
    return {
      id: nextId++,
      title: `${subject.title} Assessment`,
      description: `Comprehensive test covering core concepts in ${subject.title}`,
      duration: randomDuration,
      questions: randomQuestions,
      difficulty: randomDifficulty,
      category: subject.title
    };
  });
  
  return [...allTests, ...newTests];
};

const MockTests = () => {
  const [filter, setFilter] = useState("all");
  const [allMockTests, setAllMockTests] = useState<typeof mockTests>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();
  
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

  const handleStartTest = (test: any) => {
    toast.success(`Starting ${test.title}`, {
      description: `${test.questions} questions • ${test.duration} minutes`
    });
    // For now just show a success message, in a real app we would navigate to the test page
    console.log(`Starting test: ${test.title}`);
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
              <Card className="h-full hover:shadow-md transition-shadow duration-300 cursor-pointer" 
                onClick={() => handleStartTest(test)}>
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
                  
                  <Button 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartTest(test);
                    }}
                  >
                    Start Test
                  </Button>
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
