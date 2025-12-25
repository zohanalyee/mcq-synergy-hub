import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Sparkles, Search } from "lucide-react";
import Header from "@/components/Header";
import CategoryFilter from "@/components/subjects/CategoryFilter";
import PurposeFilter from "@/components/subjects/PurposeFilter";
import FilterSummary from "@/components/subjects/FilterSummary";
import SubjectGrid from "@/components/subjects/SubjectGrid";
import { Input } from "@/components/ui/input";
import { subjects as initialSubjects } from "@/data/subjectsData";
import { getSubjects } from "@/services/adminService";

const Subjects = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPurpose, setSelectedPurpose] = useState<string>("All");
  const [subjects, setSubjects] = useState(initialSubjects);
  
  useEffect(() => {
    // Load subjects from localStorage if available, otherwise use initial data
    const managedSubjects = getSubjects();
    if (managedSubjects.length > 0) {
      setSubjects(managedSubjects);
    }
    setIsLoaded(true);
  }, []);

  const getCategories = () => {
    const categories = subjects.map(subject => subject.category);
    return ["All", ...Array.from(new Set(categories))];
  };

  const filteredSubjects = subjects.filter(subject => {
    const categoryMatch = selectedCategory === "All" || subject.category === selectedCategory;
    const purposeMatch = selectedPurpose === "All" || subject.purpose === selectedPurpose.toLowerCase();
    
    const searchMatch = subject.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       subject.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return categoryMatch && purposeMatch && searchMatch;
  });

  const purposeOptions = ["All", "Reading", "MCQs"];
  
  const isFiltered = searchQuery !== "" || selectedCategory !== "All" || selectedPurpose !== "All";
  
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedPurpose("All");
  };

  return (
    <Header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-24">
        {/* Enhanced Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Explore & Learn</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="text-gradient">Subjects</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Browse subjects, read content, and practice with MCQs. Choose Read Mode for memorization or Practice Mode for self-testing.
          </p>
        </motion.div>
        
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-4"
        >
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search subjects by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 text-base rounded-xl bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary shadow-sm"
            />
          </div>
        </motion.div>
        
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row justify-between items-start sm:items-center">
            <CategoryFilter 
              categories={getCategories()} 
              selectedCategory={selectedCategory} 
              setSelectedCategory={setSelectedCategory} 
            />
            
            <PurposeFilter 
              options={purposeOptions} 
              selectedPurpose={selectedPurpose} 
              setSelectedPurpose={setSelectedPurpose} 
            />
          </div>
        </motion.div>

        <FilterSummary 
          count={filteredSubjects.length} 
          isFiltered={isFiltered} 
          clearFilters={clearFilters} 
        />

        <SubjectGrid 
          subjects={filteredSubjects} 
          isLoaded={isLoaded} 
        />
      </div>
    </Header>
  );
};

export default Subjects;
