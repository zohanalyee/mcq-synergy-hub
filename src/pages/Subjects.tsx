import { Book, Code, Beaker, Brain, Atom, Calculator, Scale, Landmark, Globe, Dumbbell, BarChart, DollarSign, Users, ShoppingCart, ScrollText, FileCheck, Zap, Building, Wrench, Cpu, Stethoscope, Microscope, Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import SubjectCard from "@/components/SubjectCard";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Input } from "@/components/ui/input";

export const subjects = [
  {
    title: "Mathematics",
    icon: <Calculator className="h-6 w-6 text-blue-500" />,
    description: "Algebra, calculus, geometry, and more topics for comprehensive math practice.",
    topicCount: 12,
    color: "#3b82f6",
    category: "Core Sciences",
  },
  {
    title: "Computer Science",
    icon: <Code className="h-6 w-6 text-emerald-500" />,
    description: "Programming, data structures, algorithms, and database concepts.",
    topicCount: 10,
    color: "#10b981",
    category: "Core Sciences",
  },
  {
    title: "Physics",
    icon: <Atom className="h-6 w-6 text-purple-500" />,
    description: "Mechanics, electromagnetism, thermodynamics, and modern physics.",
    topicCount: 8,
    color: "#8b5cf6",
    category: "Core Sciences",
  },
  {
    title: "Chemistry",
    icon: <Beaker className="h-6 w-6 text-red-500" />,
    description: "Organic, inorganic, physical chemistry and biochemistry topics.",
    topicCount: 7,
    color: "#ef4444",
    category: "Core Sciences",
  },
  {
    title: "Biology",
    icon: <Brain className="h-6 w-6 text-green-500" />,
    description: "Cell biology, genetics, ecology, evolution, and human physiology.",
    topicCount: 9,
    color: "#22c55e",
    category: "Core Sciences",
  },
  {
    title: "English",
    icon: <Book className="h-6 w-6 text-orange-500" />,
    description: "Grammar, vocabulary, comprehension, and composition practice.",
    topicCount: 6,
    color: "#f97316",
    category: "Core Sciences",
  },
  
  {
    title: "Psychology",
    icon: <Brain className="h-6 w-6 text-pink-500" />,
    description: "Behavioral studies, cognitive processes, and psychological theories.",
    topicCount: 8,
    color: "#ec4899",
    category: "Social Sciences",
  },
  {
    title: "Economics",
    icon: <BarChart className="h-6 w-6 text-blue-700" />,
    description: "Microeconomics, macroeconomics, and international economics concepts.",
    topicCount: 7,
    color: "#1d4ed8",
    category: "Social Sciences",
  },
  {
    title: "Sociology",
    icon: <Users className="h-6 w-6 text-cyan-600" />,
    description: "Social interactions, institutions, and cultural dynamics.",
    topicCount: 6,
    color: "#0891b2",
    category: "Social Sciences",
  },
  {
    title: "Political Science",
    icon: <Landmark className="h-6 w-6 text-yellow-600" />,
    description: "Political theories, systems of government, and international relations.",
    topicCount: 7,
    color: "#ca8a04",
    category: "Social Sciences",
  },
  {
    title: "Statistics",
    icon: <BarChart className="h-6 w-6 text-indigo-600" />,
    description: "Data analysis, probability, and statistical methods.",
    topicCount: 8,
    color: "#4f46e5",
    category: "Social Sciences",
  },
  {
    title: "English Literature",
    icon: <Book className="h-6 w-6 text-amber-600" />,
    description: "Literary analysis, periods, and critical reading of texts.",
    topicCount: 6,
    color: "#d97706",
    category: "Social Sciences",
  },
  {
    title: "Judiciary and Law",
    icon: <Scale className="h-6 w-6 text-gray-600" />,
    description: "Legal principles, case studies, and judicial procedures.",
    topicCount: 9,
    color: "#4b5563",
    category: "Social Sciences",
  },
  {
    title: "International Relations",
    icon: <Globe className="h-6 w-6 text-blue-600" />,
    description: "Global politics, diplomacy, and international organizations.",
    topicCount: 7,
    color: "#2563eb",
    category: "Social Sciences",
  },
  {
    title: "Physical Education",
    icon: <Dumbbell className="h-6 w-6 text-rose-600" />,
    description: "Sports science, fitness, and physical health concepts.",
    topicCount: 5,
    color: "#e11d48",
    category: "Social Sciences",
  },
  
  {
    title: "Agriculture",
    icon: <Beaker className="h-6 w-6 text-green-600" />,
    description: "Crop science, soil management, and agricultural technologies.",
    topicCount: 8,
    color: "#16a34a",
    category: "Agriculture & Environment",
  },
  {
    title: "Forestry",
    icon: <Beaker className="h-6 w-6 text-emerald-700" />,
    description: "Forest management, conservation, and ecosystem principles.",
    topicCount: 6,
    color: "#047857",
    category: "Agriculture & Environment",
  },
  
  {
    title: "Finance",
    icon: <DollarSign className="h-6 w-6 text-green-500" />,
    description: "Financial markets, investments, and corporate finance.",
    topicCount: 8,
    color: "#22c55e",
    category: "Management Sciences",
  },
  {
    title: "Human Resource Management",
    icon: <Users className="h-6 w-6 text-blue-500" />,
    description: "Personnel management, organizational behavior, and employee relations.",
    topicCount: 7,
    color: "#3b82f6",
    category: "Management Sciences",
  },
  {
    title: "Marketing",
    icon: <ShoppingCart className="h-6 w-6 text-orange-500" />,
    description: "Marketing strategies, consumer behavior, and brand management.",
    topicCount: 6,
    color: "#f97316",
    category: "Management Sciences",
  },
  {
    title: "Accounting",
    icon: <ScrollText className="h-6 w-6 text-slate-600" />,
    description: "Financial accounting, cost accounting, and accounting standards.",
    topicCount: 9,
    color: "#64748b",
    category: "Management Sciences",
  },
  {
    title: "Auditing",
    icon: <FileCheck className="h-6 w-6 text-violet-500" />,
    description: "Audit procedures, standards, and financial reporting practices.",
    topicCount: 7,
    color: "#8b5cf6",
    category: "Management Sciences",
  },
  
  {
    title: "Electrical Engineering",
    icon: <Zap className="h-6 w-6 text-yellow-500" />,
    description: "Circuits, electronics, power systems, and signal processing.",
    topicCount: 10,
    color: "#eab308",
    category: "Engineering",
  },
  {
    title: "Civil Engineering",
    icon: <Building className="h-6 w-6 text-slate-500" />,
    description: "Structural analysis, construction, and infrastructure design.",
    topicCount: 9,
    color: "#64748b",
    category: "Engineering",
  },
  {
    title: "Mechanical Engineering",
    icon: <Wrench className="h-6 w-6 text-zinc-600" />,
    description: "Thermodynamics, mechanics, and machine design principles.",
    topicCount: 8,
    color: "#52525b",
    category: "Engineering",
  },
  {
    title: "Chemical Engineering",
    icon: <Beaker className="h-6 w-6 text-red-500" />,
    description: "Chemical processes, reactor design, and thermodynamics.",
    topicCount: 7,
    color: "#ef4444",
    category: "Engineering",
  },
  {
    title: "Software Engineering",
    icon: <Cpu className="h-6 w-6 text-teal-500" />,
    description: "Software development lifecycle, design patterns, and testing methodologies.",
    topicCount: 8,
    color: "#14b8a6",
    category: "Engineering",
  },
  
  {
    title: "Microbiology",
    icon: <Microscope className="h-6 w-6 text-emerald-500" />,
    description: "Study of microorganisms, bacteria, viruses, and their applications.",
    topicCount: 8,
    color: "#10b981",
    category: "Medical Sciences",
  },
  {
    title: "Biochemistry",
    icon: <Beaker className="h-6 w-6 text-purple-500" />,
    description: "Chemical processes and substances in living organisms.",
    topicCount: 9,
    color: "#8b5cf6",
    category: "Medical Sciences",
  },
  {
    title: "Oral Anatomy",
    icon: <Stethoscope className="h-6 w-6 text-red-400" />,
    description: "Structure and function of oral and dental tissues.",
    topicCount: 6,
    color: "#f87171",
    category: "Medical Sciences",
  },
  {
    title: "General Anatomy",
    icon: <Brain className="h-6 w-6 text-pink-500" />,
    description: "Human body structure, systems, and tissue organization.",
    topicCount: 10,
    color: "#ec4899",
    category: "Medical Sciences",
  },
  {
    title: "Oral Pathology and Medicine",
    icon: <Stethoscope className="h-6 w-6 text-rose-600" />,
    description: "Diseases of oral and maxillofacial regions.",
    topicCount: 7,
    color: "#e11d48",
    category: "Medical Sciences",
  },
  {
    title: "Oral Histology",
    icon: <Microscope className="h-6 w-6 text-indigo-500" />,
    description: "Microscopic structure and development of oral tissues.",
    topicCount: 5,
    color: "#6366f1",
    category: "Medical Sciences",
  },
  {
    title: "Pathology",
    icon: <Microscope className="h-6 w-6 text-amber-600" />,
    description: "Disease processes, causes, and effects on body systems.",
    topicCount: 9,
    color: "#d97706",
    category: "Medical Sciences",
  },
  {
    title: "Dental Materials",
    icon: <Beaker className="h-6 w-6 text-sky-500" />,
    description: "Materials used in dentistry and their properties.",
    topicCount: 6,
    color: "#0ea5e9",
    category: "Medical Sciences",
  },
  {
    title: "Pharmacology",
    icon: <Beaker className="h-6 w-6 text-green-600" />,
    description: "Drug actions, interactions, and therapeutic applications.",
    topicCount: 8,
    color: "#16a34a",
    category: "Medical Sciences",
  },
  {
    title: "Physiology",
    icon: <Stethoscope className="h-6 w-6 text-blue-500" />,
    description: "Functions and mechanisms of living systems and organs.",
    topicCount: 10,
    color: "#3b82f6",
    category: "Medical Sciences",
  },
];

const Subjects = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const getCategories = () => {
    const categories = subjects.map(subject => subject.category);
    return ["All", ...Array.from(new Set(categories))];
  };

  const filteredSubjects = subjects.filter(subject => {
    const categoryMatch = selectedCategory === "All" || subject.category === selectedCategory;
    
    const searchMatch = subject.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       subject.description.toLowerCase().includes(searchQuery.toLowerCase());
    
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
    { title: "Subjects", href: "/subjects", isCurrent: true },
  ];

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-16">
        <PageBreadcrumb items={breadcrumbItems} />
        
        <div className="mb-12">
          <motion.h1 
            className="text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Explore Subjects
          </motion.h1>
          <motion.p 
            className="text-muted-foreground max-w-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Choose from a variety of subjects to create your custom MCQ test syllabus. Each subject contains numerous topics and subtopics.
          </motion.p>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex space-x-2 min-w-max">
            {getCategories().map((category) => (
              <motion.button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </div>

        {filteredSubjects.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={container}
            initial="hidden"
            animate={isLoaded ? "show" : "hidden"}
          >
            {filteredSubjects.map((subject, index) => (
              <motion.div key={subject.title} variants={item}>
                <SubjectCard
                  title={subject.title}
                  icon={subject.icon}
                  description={subject.description}
                  topicCount={subject.topicCount}
                  color={subject.color}
                  onClick={() => console.log(`Selected subject: ${subject.title}`)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No subjects match your search criteria.</p>
            <motion.button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear Filters
            </motion.button>
          </div>
        )}
      </div>
    </>
  );
};

export default Subjects;
