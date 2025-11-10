
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Header from "@/components/Header";
import { jobTests as initialJobTests } from "@/data/jobTestsData";
import { EnhancedSearchBox } from "@/components/mock-tests/EnhancedSearchBox";
import { SubjectTestsTab } from "@/components/mock-tests/SubjectTestsTab";
import { JobTestsTab } from "@/components/mock-tests/JobTestsTab";
import { generateAllMockTests } from "@/components/mock-tests/MockTestUtils";
import { getJobTests } from "@/services/jobTestService";

const MockTests = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [allMockTests, setAllMockTests] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("subjects");
  const [jobTests, setJobTests] = useState(initialJobTests);
  
  useEffect(() => {
    const generatedTests = generateAllMockTests();
    setAllMockTests(generatedTests);
    
    // Load job tests from localStorage if available, otherwise use initial data
    const managedJobTests = getJobTests();
    if (managedJobTests.length > 0) {
      setJobTests(managedJobTests);
    }
    
    setIsLoaded(true);
  }, []);
  
  const handleClearSearch = () => {
    setSearchQuery("");
  };
  
  return (
    <Header>
      <div className="container mx-auto px-4 pt-8 pb-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl font-bold mb-4 text-gradient">Mock Tests</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Practice with our comprehensive collection of subject-specific tests and official job examination simulations. 
            Choose your path to success.
          </p>
        </motion.div>

        <div className="mb-8">
          <EnhancedSearchBox 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
            onClearSearch={handleClearSearch}
            placeholder="Search mock tests, subjects, or job positions..."
          />
        </div>

        <Tabs defaultValue="subjects" className="mb-8" onValueChange={value => setActiveTab(value)}>
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-lg grid-cols-2 h-auto">
              <TabsTrigger value="subjects" className="gap-2">
                <span className="text-lg">📚</span>
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Subject-wise Tests</span>
                  <span className="text-xs opacity-80">Focused practice</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="jobs" className="gap-2">
                <span className="text-lg">💼</span>
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Job/Post Tests</span>
                  <span className="text-xs opacity-80">Career preparation</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="subjects">
            <SubjectTestsTab 
              allMockTests={allMockTests}
              isLoaded={isLoaded}
              searchQuery={searchQuery}
            />
          </TabsContent>
          
          <TabsContent value="jobs">
            <JobTestsTab 
              jobTests={jobTests}
              isLoaded={isLoaded}
              searchQuery={searchQuery}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Header>
  );
};

export default MockTests;
