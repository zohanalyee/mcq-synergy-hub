
import { Subject } from "@/data/subjectsData";
import { TopicsData } from "@/data/topicsData";
import { JobTest } from "@/data/jobTestsData";
import { saveSubjects } from "./subjectService";
import { saveTopics } from "./topicService";
import { saveJobTests } from "./jobTestService";

// Re-export all the domain-specific services
export { 
  getSubjects, 
  addSubject, 
  updateSubject, 
  removeSubject 
} from "./subjectService";

export { 
  getTopics, 
  addTopic, 
  removeTopic 
} from "./topicService";

export { 
  getJobTests, 
  addJobTest, 
  updateJobTest, 
  removeJobTest 
} from "./jobTestService";

// Initialize localStorage with data from the data files if it doesn't exist
export const initializeAdminData = (
  initialSubjects: Subject[], 
  initialTopics: TopicsData,
  initialJobTests: JobTest[]
) => {
  if (!localStorage.getItem('subjects')) {
    saveSubjects(initialSubjects);
  }
  
  if (!localStorage.getItem('topics')) {
    saveTopics(initialTopics);
  }
  
  if (!localStorage.getItem('jobTests')) {
    saveJobTests(initialJobTests);
  }
};
