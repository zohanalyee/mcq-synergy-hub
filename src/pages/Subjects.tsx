
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import SubjectsHeader from "@/components/subjects/SubjectsHeader";
import SubjectsSearch from "@/components/subjects/SubjectsSearch";
import CategoryFilter from "@/components/subjects/CategoryFilter";
import PurposeFilter from "@/components/subjects/PurposeFilter";
import FilterSummary from "@/components/subjects/FilterSummary";
import SubjectGrid from "@/components/subjects/SubjectGrid";
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
      <div className="container mx-auto px-4 pt-8 pb-16">
        <SubjectsHeader />
        
        <div className="mb-6">
          <SubjectsSearch 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
          />
        </div>
        
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row justify-between">
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
        </div>

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
