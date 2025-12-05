
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
      <div className="container mx-auto px-4 pt-4 pb-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 text-center"
        >
          <h1 className="text-2xl font-bold mb-1 text-gradient">Mock Tests</h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Practice with subject-specific tests and job examination simulations.
          </p>
        </motion.div>

        <div className="mb-4">
          <EnhancedSearchBox
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
            onClearSearch={handleClearSearch}
            placeholder="Search mock tests, subjects, or job positions..."
          />
        </div>

        <Tabs defaultValue="subjects" className="mb-4" onValueChange={value => setActiveTab(value)}>
          <div className="flex justify-center mb-4">
            <TabsList className="grid w-full max-w-sm grid-cols-2 h-9">
              <TabsTrigger value="subjects" className="gap-1.5 text-xs">
                <span>📚</span>
                <span className="font-medium">Subject Tests</span>
              </TabsTrigger>
              <TabsTrigger value="jobs" className="gap-1.5 text-xs">
                <span>💼</span>
                <span className="font-medium">Job Tests</span>
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
