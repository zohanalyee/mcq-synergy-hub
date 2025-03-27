
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Award, BarChart2, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";

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

const MockTests = () => {
  const [filter, setFilter] = useState("all");

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "text-green-500";
      case "Medium": return "text-amber-500";
      case "Hard": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  const filteredTests = filter === "all" 
    ? mockTests 
    : mockTests.filter(test => test.category.toLowerCase() === filter.toLowerCase());

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

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold">Mock Tests</h1>
          <p className="text-muted-foreground">Practice with our collection of subject-specific mock tests</p>
        </motion.div>

        <div className="mb-8 flex flex-wrap gap-2">
          <Button 
            variant={filter === "all" ? "default" : "outline"} 
            onClick={() => setFilter("all")}
            size="sm"
          >
            All
          </Button>
          <Button 
            variant={filter === "mathematics" ? "default" : "outline"} 
            onClick={() => setFilter("mathematics")}
            size="sm"
          >
            Mathematics
          </Button>
          <Button 
            variant={filter === "computer science" ? "default" : "outline"} 
            onClick={() => setFilter("computer science")}
            size="sm"
          >
            Computer Science
          </Button>
          <Button 
            variant={filter === "physics" ? "default" : "outline"} 
            onClick={() => setFilter("physics")}
            size="sm"
          >
            Physics
          </Button>
          <Button 
            variant={filter === "chemistry" ? "default" : "outline"} 
            onClick={() => setFilter("chemistry")}
            size="sm"
          >
            Chemistry
          </Button>
          <Button 
            variant={filter === "biology" ? "default" : "outline"} 
            onClick={() => setFilter("biology")}
            size="sm"
          >
            Biology
          </Button>
          <Button 
            variant={filter === "english" ? "default" : "outline"} 
            onClick={() => setFilter("english")}
            size="sm"
          >
            English
          </Button>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={container}
          initial="hidden"
          animate="visible"
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
                  
                  <Button className="w-full">Start Test</Button>
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
