
import { Subject } from "@/data/subjectsData";
import { TopicsData } from "@/data/topicsData";
import { JobTest } from "@/data/jobTestsData";
import { Quiz } from "@/services/quizService";
import { saveSubjects } from "./subjectService";
import { saveTopics } from "./topicService";
import { saveJobTests } from "./jobTestService";
import { saveQuizzes } from "./quizService";

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

export {
  getQuizzes,
  addQuiz,
  updateQuiz,
  removeQuiz,
  getQuizzesBySubject,
  getQuizzesByTopic
} from "./quizService";

// Initialize localStorage with data from the data files if it doesn't exist
export const initializeAdminData = (
  initialSubjects: Subject[], 
  initialTopics: TopicsData,
  initialJobTests: JobTest[],
  initialQuizzes: Quiz[] = []
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
  
  if (!localStorage.getItem('quizzes') && initialQuizzes.length > 0) {
    saveQuizzes(initialQuizzes);
  }
};
