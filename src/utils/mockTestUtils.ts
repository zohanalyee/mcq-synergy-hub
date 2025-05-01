import { subjects } from "@/data/subjectsData";

// Map of subject titles to their associated topics
export const subjectTopicsMap: Record<string, string[]> = {
  "Mathematics": [
    "Algebra", "Calculus", "Geometry", "Trigonometry", "Statistics", 
    "Linear Algebra", "Number Theory", "Discrete Mathematics", 
    "Mathematical Logic", "Differential Equations", "Complex Analysis",
    "Probability Theory"
  ],
  "Computer Science": [
    "Data Structures", "Algorithms", "Object-Oriented Programming", 
    "Database Systems", "Computer Networks", "Operating Systems", 
    "Software Engineering", "Web Development", "Machine Learning", 
    "Computer Architecture"
  ],
  "Physics": [
    "Mechanics", "Electromagnetism", "Thermodynamics", "Quantum Mechanics", 
    "Relativity", "Optics", "Nuclear Physics", "Fluid Mechanics"
  ],
  "Chemistry": [
    "Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", 
    "Biochemistry", "Analytical Chemistry", "Environmental Chemistry", 
    "Polymer Chemistry"
  ],
  "Biology": [
    "Cell Biology", "Genetics", "Ecology", "Evolution", "Molecular Biology", 
    "Microbiology", "Physiology", "Zoology", "Botany"
  ],
  "English": [
    "Grammar", "Vocabulary", "Reading Comprehension", "Writing", 
    "Literature Analysis", "Critical Reading"
  ],
  "Psychology": [
    "Clinical Psychology", "Cognitive Psychology", "Developmental Psychology", 
    "Social Psychology", "Abnormal Psychology", "Neuropsychology", 
    "Personality Psychology", "Behavioral Psychology"
  ],
  "Economics": [
    "Microeconomics", "Macroeconomics", "International Economics", 
    "Economic Development", "Monetary Policy", "Fiscal Policy", "Game Theory"
  ],
  "Sociology": [
    "Social Theory", "Cultural Sociology", "Social Institutions", 
    "Social Movements", "Urban Sociology", "Rural Sociology"
  ],
  "Political Science": [
    "Political Theory", "Comparative Politics", "International Relations", 
    "Public Policy", "Political Economy", "Constitutional Law", "Political Behavior"
  ],
  "Statistics": [
    "Descriptive Statistics", "Inferential Statistics", "Probability", 
    "Regression Analysis", "ANOVA", "Time Series", "Sampling Theory", "Bayesian Statistics"
  ],
  "English Literature": [
    "Poetry", "Drama", "Prose", "Literary Criticism", "World Literature", "Contemporary Literature"
  ],
  "Judiciary and Law": [
    "Constitutional Law", "Criminal Law", "Civil Law", "Administrative Law", 
    "International Law", "Corporate Law", "Intellectual Property", "Human Rights Law", "Environmental Law"
  ],
  "International Relations": [
    "Diplomatic History", "International Organizations", "International Security", 
    "Foreign Policy Analysis", "Global Political Economy", "Regional Studies", "International Law"
  ],
  "Physical Education": [
    "Sports Science", "Kinesiology", "Sports Psychology", "Nutrition", "Training Methods"
  ],
  "Agriculture": [
    "Crop Science", "Soil Science", "Agricultural Economics", "Animal Husbandry", 
    "Agricultural Engineering", "Plant Pathology", "Horticulture", "Sustainable Agriculture"
  ],
  "Forestry": [
    "Silviculture", "Forest Management", "Forest Ecology", "Agroforestry", 
    "Forest Conservation", "Forest Products"
  ],
  "Finance": [
    "Corporate Finance", "Investment Management", "Financial Markets", "Banking", 
    "Risk Management", "International Finance", "Financial Accounting", "Personal Finance"
  ],
  "Human Resource Management": [
    "Recruitment", "Training and Development", "Performance Appraisal", 
    "Compensation Management", "Employee Relations", "Strategic HRM", "Organizational Behavior"
  ],
  "Marketing": [
    "Marketing Research", "Consumer Behavior", "Advertising", "Digital Marketing", 
    "Brand Management", "Marketing Strategy"
  ],
  "Accounting": [
    "Financial Accounting", "Cost Accounting", "Management Accounting", "Auditing", 
    "Taxation", "Accounting Information Systems", "Forensic Accounting", "International Accounting", "Public Accounting"
  ],
  "Auditing": [
    "Internal Auditing", "External Auditing", "Compliance Audit", "Operational Audit", 
    "Financial Statement Audit", "IT Audit", "Fraud Examination"
  ],
  "Electrical Engineering": [
    "Circuit Analysis", "Digital Electronics", "Power Systems", "Control Systems", 
    "Signal Processing", "Telecommunications", "Microelectronics", "Electromagnetic Theory", 
    "Power Electronics", "Embedded Systems"
  ],
  "Civil Engineering": [
    "Structural Analysis", "Transportation Engineering", "Geotechnical Engineering", 
    "Environmental Engineering", "Construction Management", "Hydraulics and Hydrology", 
    "Surveying", "Materials Science", "Foundation Engineering"
  ],
  "Mechanical Engineering": [
    "Thermodynamics", "Fluid Mechanics", "Heat Transfer", "Machine Design", 
    "Manufacturing Processes", "Robotics", "Control Engineering", "Vibration Analysis"
  ],
  "Chemical Engineering": [
    "Chemical Process Design", "Reaction Engineering", "Transport Phenomena", 
    "Separation Processes", "Process Control", "Biochemical Engineering", "Materials Science"
  ],
  "Software Engineering": [
    "Software Design", "Software Testing", "Software Project Management", 
    "Software Requirements", "Software Quality Assurance", "Software Metrics", 
    "Software Architecture", "Programming Languages"
  ],
  "Microbiology": [
    "Bacteriology", "Virology", "Mycology", "Immunology", "Environmental Microbiology", 
    "Industrial Microbiology", "Medical Microbiology", "Food Microbiology"
  ],
  "Biochemistry": [
    "Enzymology", "Metabolism", "Molecular Biology", "Structural Biochemistry", 
    "Bioenergetics", "Nucleic Acids", "Protein Structure", "Signal Transduction", "Biochemical Methods"
  ],
  "Oral Anatomy": [
    "Teeth Anatomy", "Oral Cavity", "Salivary Glands", "Jaw Structure", 
    "Dental Tissues", "Craniofacial Development"
  ],
  "General Anatomy": [
    "Musculoskeletal System", "Cardiovascular System", "Nervous System", 
    "Respiratory System", "Digestive System", "Urinary System", "Reproductive System", 
    "Endocrine System", "Lymphatic System", "Integumentary System"
  ],
  "Oral Pathology and Medicine": [
    "Oral Infections", "Oral Cancers", "Developmental Anomalies", 
    "Oral Manifestations of Systemic Diseases", "Dental Caries", "Periodontal Disease", "Oral Mucosal Lesions"
  ],
  "Oral Histology": [
    "Dental Enamel", "Dentin", "Dental Pulp", "Cementum", "Periodontal Ligament"
  ],
  "Pathology": [
    "General Pathology", "Systemic Pathology", "Cellular Pathology", 
    "Immunopathology", "Molecular Pathology", "Hematopathology", "Infectious Disease Pathology", 
    "Neoplasia", "Cardiovascular Pathology"
  ],
  "Dental Materials": [
    "Restorative Materials", "Impression Materials", "Dental Cements", 
    "Prosthodontic Materials", "Orthodontic Materials", "Dental Implant Materials"
  ],
  "Pharmacology": [
    "Pharmacokinetics", "Pharmacodynamics", "Neuropharmacology", "Cardiovascular Pharmacology", 
    "Antimicrobial Agents", "Analgesics", "Anesthetics", "Psychopharmacology"
  ],
  "Physiology": [
    "Cell Physiology", "Neurophysiology", "Cardiovascular Physiology", "Respiratory Physiology", 
    "Renal Physiology", "Endocrine Physiology", "Gastrointestinal Physiology", 
    "Reproductive Physiology", "Exercise Physiology", "Environmental Physiology"
  ]
};

// Helper function to get topics for a subject
export const getTopicsForSubject = (subject: string): string[] => {
  return subjectTopicsMap[subject] || [];
};

// Generate a random topic list for a subject
export const getRandomTopics = (subject: string, count: number = 3): string[] => {
  const availableTopics = getTopicsForSubject(subject);
  
  if (!availableTopics.length) return [`${subject} Topic 1`, `${subject} Topic 2`, `${subject} Topic 3`];
  
  if (availableTopics.length <= count) return availableTopics;
  
  const shuffled = [...availableTopics].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
