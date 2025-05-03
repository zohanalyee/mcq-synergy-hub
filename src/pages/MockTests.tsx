
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Header from "@/components/Header";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { jobTests as initialJobTests } from "@/data/jobTestsData";
import { SearchBox } from "@/components/mock-tests/SearchBox";
import { SubjectTestsTab } from "@/components/mock-tests/SubjectTestsTab";
import { JobTestsTab } from "@/components/mock-tests/JobTestsTab";
import { generateAllMockTests } from "@/components/mock-tests/MockTestUtils";
import { getJobTests } from "@/services/adminService";

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
  
  const breadcrumbItems = [{
    title: "Home",
    href: "/"
  }, {
    title: "Mock Tests",
    href: "/mock-tests",
    isCurrent: true
  }];

  const handleClearSearch = () => {
    setSearchQuery("");
  };
  
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

        <div className="mb-6">
          <SearchBox 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
          />
        </div>

        <Tabs defaultValue="subjects" className="mb-8" onValueChange={value => setActiveTab(value)}>
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 bg-blue-200">
            <TabsTrigger value="subjects">Subject-wise Tests</TabsTrigger>
            <TabsTrigger value="jobs">Job/Post Tests</TabsTrigger>
          </TabsList>
          
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
    </>
  );
};

export default MockTests;
