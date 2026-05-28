export interface BlogPreset {
  id: string;
  label: string;
  category: string;
  instruction: string;
  default_keywords: string[];
}

export const BLOG_PRESETS: BlogPreset[] = [
  {
    id: "mdcat-guide",
    label: "Complete Guide to Passing MDCAT 2026",
    category: "entry-test",
    instruction:
      "Write a comprehensive Pakistan-context guide for students preparing for the MDCAT 2026 exam (PMC syllabus). Cover syllabus breakdown (Biology, Chemistry, Physics, English, Logical Reasoning), study schedule, recommended books, common pitfalls, and last-month strategy.",
    default_keywords: ["MDCAT 2026", "MDCAT preparation", "PMC", "medical entry test Pakistan"],
  },
  {
    id: "ecat-tips",
    label: "Top Strategies for ECAT Preparation",
    category: "entry-test",
    instruction:
      "Write a detailed preparation guide for the ECAT engineering entrance test in Pakistan. Cover Math, Physics, Chemistry/Computer, English sections, time management, and mock test strategy.",
    default_keywords: ["ECAT", "engineering entry test", "UET admission", "Pakistan"],
  },
  {
    id: "nust-net-guide",
    label: "How to Crack the NUST NET Entry Test",
    category: "entry-test",
    instruction:
      "Write a complete preparation roadmap for NUST NET (National Entry Test). Cover pattern, syllabus weightage, sectional cutoffs, and proven study techniques.",
    default_keywords: ["NUST NET", "NUST entry test", "engineering admission"],
  },
  {
    id: "css-prep",
    label: "Beginner's Roadmap to CSS Exam",
    category: "competitive",
    instruction:
      "Write a step-by-step roadmap for first-time CSS aspirants in Pakistan. Cover compulsory subjects, optional subject selection, current affairs, essay practice, and FPSC interview preparation.",
    default_keywords: ["CSS exam", "FPSC", "CSS preparation", "civil services Pakistan"],
  },
  {
    id: "fpsc-tips",
    label: "Top Tips for FPSC Tests",
    category: "competitive",
    instruction:
      "Write practical preparation tips for FPSC tests (assistant, inspector, lecturer roles). Include syllabus pattern, MCQ strategy, recommended past papers, and interview etiquette.",
    default_keywords: ["FPSC", "FPSC tests", "federal jobs Pakistan", "past papers"],
  },
  {
    id: "ppsc-strategy",
    label: "PPSC Exam: Smart Study Plan",
    category: "competitive",
    instruction:
      "Write a focused study plan for PPSC exams in Punjab. Cover general knowledge, Pakistan affairs, Urdu/English comprehension, and time-efficient revision techniques.",
    default_keywords: ["PPSC", "Punjab Public Service Commission", "Punjab government jobs"],
  },
  {
    id: "9th-class-routine",
    label: "9th Class Study Routine for Top Marks",
    category: "school",
    instruction:
      "Write a daily and weekly study routine for Pakistani 9th class students aiming for top board marks. Cover all major subjects, time blocks, revision cycles, and parent guidance tips.",
    default_keywords: ["9th class", "Matric preparation", "Pakistani board exams", "study routine"],
  },
  {
    id: "hec-scholarships",
    label: "How to Apply for HEC Scholarships",
    category: "scholarships",
    instruction:
      "Write an application guide for HEC (Higher Education Commission) scholarships available to Pakistani students. Cover eligibility, documents, deadlines, and common application mistakes.",
    default_keywords: ["HEC scholarships", "Pakistan scholarships", "higher education funding"],
  },
  {
    id: "study-abroad-pk",
    label: "Study Abroad Guide for Pakistani Students",
    category: "scholarships",
    instruction:
      "Write a guide for Pakistani students planning to study abroad. Cover fully-funded scholarships, country choices, visa basics, language tests (IELTS/TOEFL), and timeline.",
    default_keywords: ["study abroad Pakistan", "fully funded scholarships", "IELTS", "international study"],
  },
  {
    id: "css-interview",
    label: "CSS / PPSC Interview Strategy",
    category: "competitive",
    instruction:
      "Write a practical guide to CSS and PPSC interviews. Cover mindset, dress code, common questions, current affairs preparation, and how to handle stress questions.",
    default_keywords: ["CSS interview", "PPSC interview", "psychological assessment", "civil services"],
  },
  {
    id: "pak-army-test",
    label: "Pakistan Army Initial Test Preparation",
    category: "forces",
    instruction:
      "Write a complete preparation guide for Pakistan Army initial tests (PMA, Soldier, M-Cadet). Cover written, physical, ISSB, and medical phases.",
    default_keywords: ["Pak Army test", "PMA", "ISSB", "armed forces Pakistan"],
  },
  {
    id: "time-management",
    label: "Time Management for Pakistani Students",
    category: "study-tips",
    instruction:
      "Write actionable time-management advice tailored to Pakistani students juggling school, tuition, and home responsibilities. Include sample schedules and digital tool tips.",
    default_keywords: ["time management", "study tips", "Pakistani students", "productivity"],
  },
];
