
// This file re-exports functionality from domain-specific services
// to maintain backward compatibility with existing code

// Import and re-export from base content service
export {
  getAllContent,
  getApprovedContent,
  getContentByCategory,
  getPendingContent,
  updateContentStatus,
  deleteContent,
  getContentBySubjectAndTopic,
  getSubjectsAndTopics
} from './baseContentService';

// Import and re-export from MCQ service
export {
  parseCSVForMCQs,
  getMCQsBySubject,
  getAllMCQs
} from './mcqService';

// Import and re-export from quiz service
export {
  parseCSVForQuizzes,
  getQuizzes,
  getQuizzesBySubject,
  getQuizzesByTopic
} from './quizService';

// Import and re-export from content submission service
export {
  submitContent
} from './contentSubmissionService';
