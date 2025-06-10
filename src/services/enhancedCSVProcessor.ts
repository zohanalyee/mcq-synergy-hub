
import { ContentItem, ContentCategory, ContentSubmission } from "@/interfaces/content";
import { submitContent } from "@/services/contentService";
import { UserRole } from "@/contexts/UserRoleContext";

export interface CSVProcessingResult {
  items: ContentSubmission[];
  errors: string[];
  warnings: string[];
  fileName?: string;
  successCount?: number;
  failureCount?: number;
}

export const processAndSubmitCSV = async (
  csvContent: string, 
  category: ContentCategory,
  userRole: UserRole,
  fileName?: string
): Promise<CSVProcessingResult> => {
  const result: CSVProcessingResult = {
    items: [],
    errors: [],
    warnings: [],
    fileName,
    successCount: 0,
    failureCount: 0
  };

  try {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length <= 1) {
      result.errors.push('CSV file is empty or has no data rows');
      return result;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      try {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const item = createSubmissionFromCSVRow(headers, values, category);
        
        if (item) {
          // Submit directly to database
          try {
            await submitContent(item, userRole);
            result.successCount = (result.successCount || 0) + 1;
            result.items.push(item);
          } catch (submitError) {
            result.failureCount = (result.failureCount || 0) + 1;
            result.errors.push(`Row ${i + 1}: Failed to save - ${submitError.message}`);
          }
        }
      } catch (error) {
        result.failureCount = (result.failureCount || 0) + 1;
        result.errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

  } catch (error) {
    result.errors.push(`Failed to parse CSV: ${error.message}`);
  }

  return result;
};

const createSubmissionFromCSVRow = (
  headers: string[], 
  values: string[], 
  category: ContentCategory
): ContentSubmission | null => {
  const item: Partial<ContentSubmission> = {
    category,
    tags: [],
    status: 'approved' // Auto-approve admin submissions
  };

  for (let i = 0; i < headers.length && i < values.length; i++) {
    const header = headers[i];
    const value = values[i];
    
    if (!value) continue;

    switch (header) {
      case 'title':
        item.title = value;
        break;
      case 'description':
        item.description = value;
        break;
      case 'subject':
        item.subject = value;
        break;
      case 'topic':
        item.topic = value;
        break;
      case 'tags':
        item.tags = value.split(',').map(v => v.trim());
        break;
      case 'deadline':
        item.deadline = value;
        break;
      case 'institution':
        item.institution = value;
        break;
      case 'department':
        item.department = value;
        break;
      case 'scholarshiptype':
      case 'scholarship_type':
        item.scholarshipType = value;
        break;
      case 'examtype':
      case 'exam_type':
        item.examType = value;
        break;
      case 'examyear':
      case 'exam_year':
        item.examYear = value;
        break;
      case 'question':
        // For MCQ/Quiz questions, store in description for now
        item.description = value;
        break;
      case 'optiona':
      case 'option_a':
        item.options = { ...item.options, A: value };
        break;
      case 'optionb':
      case 'option_b':
        item.options = { ...item.options, B: value };
        break;
      case 'optionc':
      case 'option_c':
        item.options = { ...item.options, C: value };
        break;
      case 'optiond':
      case 'option_d':
        item.options = { ...item.options, D: value };
        break;
      case 'correctoption':
      case 'correct_option':
        item.correctOption = value.toUpperCase();
        break;
      case 'difficulty':
        item.difficulty = value;
        break;
      case 'explanation':
        item.explanation = value;
        break;
      case 'metatitle':
      case 'meta_title':
        item.metaTitle = value;
        break;
      case 'metadescription':
      case 'meta_description':
        item.metaDescription = value;
        break;
    }
  }

  // Validate required fields
  if (!item.title) {
    throw new Error('Missing required field: title');
  }

  return item as ContentSubmission;
};

export const generateCSVTemplate = (category: ContentCategory): string => {
  const templates = {
    scholarship: 'title,description,deadline,institution,scholarshipType,tags,metaTitle,metaDescription\n"Sample Scholarship","Merit-based scholarship for students","2024-12-31","University of Punjab","Merit","education,scholarship","Scholarship Title","Scholarship for students"',
    
    job: 'title,description,deadline,department,governmentLevel,cadre,tags,metaTitle,metaDescription\n"Assistant Director","Government job opportunity","2024-12-31","Education Department","Federal","BPS-17","government,job","Job Title","Government job opportunity"',
    
    past_paper: 'title,description,examType,examYear,subject,tags,metaTitle,metaDescription\n"Mathematics Paper 2023","Past paper for mathematics","Matric","2023","Mathematics","math,past paper","Math Paper","Mathematics past paper 2023"',
    
    mcq: 'title,question,optionA,optionB,optionC,optionD,correctOption,subject,topic,difficulty,explanation\n"Sample MCQ","What is 2+2?","3","4","5","6","B","Mathematics","Arithmetic","Easy","Basic addition: 2+2=4"',
    
    quiz: 'title,question,optionA,optionB,optionC,optionD,correctOption,subject,topic,timeLimit,marks,explanation\n"Math Quiz","What is 5*5?","20","25","30","35","B","Mathematics","Multiplication","30","1","Basic multiplication: 5*5=25"'
  };

  return templates[category] || templates.scholarship;
};
