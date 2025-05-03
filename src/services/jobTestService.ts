
import { JobTest } from "@/data/jobTestsData";

// Job Tests Management
export const getJobTests = (): JobTest[] => {
  try {
    const savedJobTests = localStorage.getItem('jobTests');
    if (savedJobTests) {
      return JSON.parse(savedJobTests);
    }
  } catch (error) {
    console.error("Error loading job tests:", error);
  }
  
  // If we can't load from localStorage, return an empty array
  return [];
};

export const saveJobTests = (jobTests: JobTest[]) => {
  try {
    localStorage.setItem('jobTests', JSON.stringify(jobTests));
    return true;
  } catch (error) {
    console.error("Error saving job tests:", error);
    return false;
  }
};

export const addJobTest = (jobTest: Omit<JobTest, "id">) => {
  try {
    const jobTests = getJobTests();
    
    // Generate an ID
    const newId = jobTests.length > 0 
      ? Math.max(...jobTests.map(t => t.id)) + 1 
      : 1;
    
    const newJobTest: JobTest = {
      ...jobTest,
      id: newId
    };
    
    const updatedJobTests = [...jobTests, newJobTest];
    saveJobTests(updatedJobTests);
    
    return newJobTest;
  } catch (error) {
    console.error("Error adding job test:", error);
    return null;
  }
};

export const updateJobTest = (jobTest: JobTest) => {
  try {
    const jobTests = getJobTests();
    const updatedJobTests = jobTests.map(t => 
      t.id === jobTest.id ? jobTest : t
    );
    
    saveJobTests(updatedJobTests);
    return jobTest;
  } catch (error) {
    console.error("Error updating job test:", error);
    return null;
  }
};

export const removeJobTest = (id: number) => {
  try {
    const jobTests = getJobTests();
    const updatedJobTests = jobTests.filter(t => t.id !== id);
    
    saveJobTests(updatedJobTests);
    return true;
  } catch (error) {
    console.error("Error removing job test:", error);
    return false;
  }
};
