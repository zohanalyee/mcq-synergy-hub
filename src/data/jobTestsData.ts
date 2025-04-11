
// Job/Post test data with predefined syllabi
export interface SyllabusItem {
  topic: string;
  percentage: number;
}

export interface JobTest {
  id: number;
  title: string;
  description: string;
  organization: string;
  duration: number;
  questions: number;
  syllabus: SyllabusItem[];
}

export const jobTests: JobTest[] = [
  {
    id: 1,
    title: "Election Officer (BPS-17)",
    description: "Comprehensive test for Election Officer position based on official syllabus",
    organization: "Election Commission",
    duration: 90,
    questions: 100,
    syllabus: [
      { topic: "English", percentage: 30 },
      { topic: "The Constitution of Islamic Republic of Pakistan, 1973 (Part-I, II & VIII)", percentage: 30 },
      { topic: "Election Act 2017", percentage: 30 },
      { topic: "Islamiyat", percentage: 10 },
      { topic: "Pakistan Affairs", percentage: 10 },
      { topic: "Current Affairs", percentage: 10 },
      { topic: "Every Day Science", percentage: 10 },
    ]
  },
  {
    id: 2,
    title: "Assistant Director (BPS-17)",
    description: "Test for Assistant Director position in Federal Government",
    organization: "Federal Public Service Commission",
    duration: 120,
    questions: 100,
    syllabus: [
      { topic: "English Comprehension", percentage: 20 },
      { topic: "General Knowledge", percentage: 20 },
      { topic: "Pakistan Affairs", percentage: 15 },
      { topic: "Islamic Studies", percentage: 10 },
      { topic: "Quantitative Reasoning", percentage: 20 },
      { topic: "Analytical Reasoning", percentage: 15 }
    ]
  },
  {
    id: 3,
    title: "Banking Officer (OG-2)",
    description: "Recruitment test for Banking Officer positions",
    organization: "State Bank of Pakistan",
    duration: 120,
    questions: 100,
    syllabus: [
      { topic: "English", percentage: 20 },
      { topic: "Economics and Finance", percentage: 25 },
      { topic: "Quantitative Analysis", percentage: 20 },
      { topic: "Business Communication", percentage: 15 },
      { topic: "Pakistan Affairs", percentage: 10 },
      { topic: "Information Technology", percentage: 10 }
    ]
  },
  {
    id: 4,
    title: "Civil Judge (BPS-18)",
    description: "Provincial test for Civil Judge positions",
    organization: "Provincial Judicial Service",
    duration: 180,
    questions: 100,
    syllabus: [
      { topic: "Civil Law", percentage: 30 },
      { topic: "Criminal Law", percentage: 30 },
      { topic: "Constitutional Law", percentage: 20 },
      { topic: "Islamic Law", percentage: 10 },
      { topic: "English", percentage: 10 }
    ]
  },
  {
    id: 5,
    title: "Lecturer (BPS-17)",
    description: "Public Service Commission test for Lecturer positions",
    organization: "Provincial Public Service Commission",
    duration: 90,
    questions: 100,
    syllabus: [
      { topic: "Subject Specialization", percentage: 50 },
      { topic: "General Knowledge", percentage: 15 },
      { topic: "Pakistan Affairs", percentage: 10 },
      { topic: "Islamic Studies", percentage: 10 },
      { topic: "English", percentage: 15 }
    ]
  }
];
