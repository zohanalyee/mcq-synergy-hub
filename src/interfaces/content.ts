
export type ContentCategory = 'scholarship' | 'job' | 'mcq' | 'past_paper' | 'quiz';

export type ContentStatus = 'pending' | 'approved' | 'rejected';

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  category: ContentCategory;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  status: ContentStatus;
  createdBy: string;
  imageUrl?: string;
  fileUrl?: string;
  deadline?: string;
  department?: string;
  governmentLevel?: string;
  cadre?: string;
  scholarshipType?: string;
  institution?: string;
  examType?: string;
  examYear?: string;
  // SEO fields
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  // MCQ and Quiz specific fields
  subject?: string;
  topic?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  explanation?: string;
  options?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctOption?: 'A' | 'B' | 'C' | 'D';
  timeLimit?: number;
  marks?: number;
  questions?: MCQItem[];
  // Visibility settings
  showInSubjects?: boolean;
  showInSyllabus?: boolean;
  showInMockTests?: boolean;
}

export interface MCQItem {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  subject: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  explanation: string;
}

export interface QuizItem {
  title: string;
  questions: MCQItem[];
  subject: string;
  topic: string;
  timeLimit: number;
  marks: number;
}

export interface ContentSubmission {
  title: string;
  description: string;
  category: ContentCategory;
  tags: string[];
  imageFile?: File;
  documentFile?: File;
  deadline?: string;
  department?: string;
  governmentLevel?: string;
  cadre?: string;
  scholarshipType?: string;
  institution?: string;
  examType?: string;
  examYear?: string;
  // SEO fields
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  // MCQ and Quiz CSV
  csvFile?: File;
  // Visibility settings
  showInSubjects?: boolean;
  showInSyllabus?: boolean;
  showInMockTests?: boolean;
}
