import { ContentItem, ContentCategory, ContentSubmission } from "@/interfaces/content";
import { v4 as uuidv4 } from 'uuid';
import { findOrCreateSubject } from "./supabaseSubjectService";
import { findOrCreateTopic } from "./supabaseTopicService";

// Helper function to safely parse dates
const parseDate = (dateStr: string | null | undefined): string | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  const trimmed = dateStr.trim();
  if (!trimmed) return null;
  
  // Check if it's already an ISO string
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  if (isoRegex.test(trimmed)) return trimmed;
  
  // Try common date formats
  const formats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    /^\d{1,2}\/\d{1,2}\/\d{4}$/, // M/D/YYYY
  ];
  
  const hasValidFormat = formats.some(format => format.test(trimmed));
  if (!hasValidFormat) return null;
  
  try {
    const date = new Date(trimmed);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
};

export interface CSVProcessingResult {
  items: ContentSubmission[];
  errors: string[];
  warnings: string[];
  fileName?: string;
}

export interface CSVField {
  name: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'array';
  description: string;
}

// CSV templates for different content types
export const CSV_TEMPLATES: Record<ContentCategory, CSVField[]> = {
  scholarship: [
    { name: 'title', required: true, type: 'string', description: 'Scholarship title' },
    { name: 'description', required: true, type: 'string', description: 'Detailed description' },
    { name: 'deadline', required: false, type: 'date', description: 'Application deadline (YYYY-MM-DD)' },
    { name: 'institution', required: false, type: 'string', description: 'Offering institution' },
    { name: 'scholarshipType', required: false, type: 'string', description: 'Type of scholarship' },
    { name: 'tags', required: false, type: 'array', description: 'Comma-separated tags' },
    { name: 'metaTitle', required: false, type: 'string', description: 'SEO title' },
    { name: 'metaDescription', required: false, type: 'string', description: 'SEO description' },
  ],
  job: [
    { name: 'title', required: true, type: 'string', description: 'Job title' },
    { name: 'description', required: true, type: 'string', description: 'Job description' },
    { name: 'deadline', required: false, type: 'date', description: 'Application deadline (YYYY-MM-DD)' },
    { name: 'department', required: false, type: 'string', description: 'Department/Ministry' },
    { name: 'governmentLevel', required: false, type: 'string', description: 'Federal/Provincial/District' },
    { name: 'cadre', required: false, type: 'string', description: 'Job cadre/group' },
    { name: 'tags', required: false, type: 'array', description: 'Comma-separated tags' },
    { name: 'metaTitle', required: false, type: 'string', description: 'SEO title' },
    { name: 'metaDescription', required: false, type: 'string', description: 'SEO description' },
  ],
  past_paper: [
    { name: 'title', required: true, type: 'string', description: 'Paper title' },
    { name: 'description', required: true, type: 'string', description: 'Paper description' },
    { name: 'examType', required: false, type: 'string', description: 'Type of exam' },
    { name: 'examYear', required: false, type: 'string', description: 'Year of exam' },
    { name: 'subject', required: false, type: 'string', description: 'Subject name' },
    { name: 'tags', required: false, type: 'array', description: 'Comma-separated tags' },
    { name: 'metaTitle', required: false, type: 'string', description: 'SEO title' },
    { name: 'metaDescription', required: false, type: 'string', description: 'SEO description' },
  ],
  mcq: [
    { name: 'question', required: true, type: 'string', description: 'Question text' },
    { name: 'optionA', required: true, type: 'string', description: 'Option A' },
    { name: 'optionB', required: true, type: 'string', description: 'Option B' },
    { name: 'optionC', required: true, type: 'string', description: 'Option C' },
    { name: 'optionD', required: true, type: 'string', description: 'Option D' },
    { name: 'correctOption', required: true, type: 'string', description: 'Correct option (A/B/C/D)' },
    { name: 'subject', required: true, type: 'string', description: 'Subject name' },
    { name: 'topic', required: true, type: 'string', description: 'Topic name' },
    { name: 'difficulty', required: false, type: 'string', description: 'Easy/Medium/Hard' },
    { name: 'explanation', required: false, type: 'string', description: 'Answer explanation' },
  ],
  quiz: [
    { name: 'title', required: true, type: 'string', description: 'Quiz title' },
    { name: 'question', required: true, type: 'string', description: 'Question text' },
    { name: 'optionA', required: true, type: 'string', description: 'Option A' },
    { name: 'optionB', required: true, type: 'string', description: 'Option B' },
    { name: 'optionC', required: true, type: 'string', description: 'Option C' },
    { name: 'optionD', required: true, type: 'string', description: 'Option D' },
    { name: 'correctOption', required: true, type: 'string', description: 'Correct option (A/B/C/D)' },
    { name: 'subject', required: true, type: 'string', description: 'Subject name' },
    { name: 'topic', required: true, type: 'string', description: 'Topic name' },
    { name: 'timeLimit', required: false, type: 'number', description: 'Time limit in seconds' },
    { name: 'marks', required: false, type: 'number', description: 'Marks for question' },
    { name: 'explanation', required: false, type: 'string', description: 'Answer explanation' },
  ]
};

// Quote-aware CSV line parser
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  return result;
};

// Helper function to normalize header names
const normalizeHeader = (header: string): string => {
  // Remove BOM and clean the header
  let cleaned = header.replace(/^\uFEFF/, '').trim().toLowerCase();
  
  // Handle common variations
  const variations: Record<string, string> = {
    'question text': 'question',
    'mcq question': 'question',
    'q': 'question',
    'option a': 'optiona',
    'option b': 'optionb', 
    'option c': 'optionc',
    'option d': 'optiond',
    'choice a': 'optiona',
    'choice b': 'optionb',
    'choice c': 'optionc', 
    'choice d': 'optiond',
    'answer a': 'optiona',
    'answer b': 'optionb',
    'answer c': 'optionc',
    'answer d': 'optiond',
    'correct answer': 'correctoption',
    'correct option': 'correctoption',
    'correct': 'correctoption',
    'answer': 'correctoption',
    'subject name': 'subject',
    'topic name': 'topic',
    'level': 'difficulty'
  };
  
  // Try direct match first
  if (variations[cleaned]) {
    return variations[cleaned];
  }
  
  // Remove all non-alphanumeric characters and try again
  const normalized = cleaned.replace(/[^a-z0-9]/g, '');
  return variations[normalized] || normalized;
};

// Auto-detect MCQ format based on headers
const detectMCQFormat = (headers: string[]): boolean => {
  const normalizedHeaders = headers.map(normalizeHeader);
  const mcqIndicators = ['question', 'optiona', 'optionb', 'optionc', 'optiond', 'correctoption'];
  const foundIndicators = mcqIndicators.filter(indicator => 
    normalizedHeaders.includes(indicator)
  );
  return foundIndicators.length >= 4; // Need at least question + 3 options
};

export const parseCSV = async (csvContent: string, category: ContentCategory): Promise<CSVProcessingResult> => {
  const result: CSVProcessingResult = {
    items: [],
    errors: [],
    warnings: []
  };

  try {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length <= 1) {
      result.errors.push('CSV file is empty or has no data rows');
      return result;
    }

    // Parse headers with quote-aware parsing
    const rawHeaders = parseCSVLine(lines[0]);
    const normalizedHeaders = rawHeaders.map(normalizeHeader);
    
    // Auto-detect MCQ format if wrong category selected
    const isMCQFormat = detectMCQFormat(rawHeaders);
    let actualCategory = category;
    
    if (isMCQFormat && category !== 'mcq') {
      actualCategory = 'mcq';
      result.warnings.push(`Auto-detected MCQ format. Processing as MCQ instead of ${category}.`);
    }
    
    const template = CSV_TEMPLATES[actualCategory];
    
    // Create header index mapping with normalized headers
    const headerIndexMap: Record<string, number> = {};
    for (let i = 0; i < normalizedHeaders.length; i++) {
      const normalized = normalizedHeaders[i];
      const templateField = template.find(f => normalizeHeader(f.name) === normalized);
      if (templateField) {
        headerIndexMap[templateField.name] = i;
      }
    }
    
    // For MCQs, don't require title/description - they'll be derived from question
    const requiredFields = template.filter(field => {
      if (actualCategory === 'mcq' && (field.name === 'title' || field.name === 'description')) {
        return false;
      }
      return field.required;
    });
    
    const missingRequired = requiredFields.filter(field => 
      !(field.name in headerIndexMap)
    );
    
    if (missingRequired.length > 0) {
      result.errors.push(`Missing required fields: ${missingRequired.map(f => f.name).join(', ')}`);
      return result;
    }

    // Process data rows with quote-aware parsing
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      try {
        const values = parseCSVLine(line);
        const item = await processCSVRow(headerIndexMap, values, actualCategory, template);
        
        if (item) {
          result.items.push(item);
        }
      } catch (error) {
        result.errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

  } catch (error) {
    result.errors.push(`Failed to parse CSV: ${error.message}`);
  }

  return result;
};

const processCSVRow = async (
  headerIndexMap: Record<string, number>, 
  values: string[], 
  category: ContentCategory,
  template: CSVField[]
): Promise<ContentSubmission | null> => {
  const item: Partial<ContentSubmission> = {
    category,
    tags: []
  };

  // Process values using header index map
  for (const [fieldName, index] of Object.entries(headerIndexMap)) {
    if (index >= values.length) continue;
    
    const value = values[index]?.trim();
    if (!value) continue;

    const field = template.find(f => f.name === fieldName);
    if (!field) continue;

    switch (field.type) {
      case 'array':
        (item as any)[fieldName] = value.split(',').map(v => v.trim());
        break;
      case 'number':
        (item as any)[fieldName] = parseInt(value) || 0;
        break;
      case 'date':
        const parsedDate = parseDate(value);
        if (parsedDate) {
          (item as any)[fieldName] = parsedDate;
        } else if (value && value.trim()) {
          console.warn(`Invalid date format in row: "${value}" for field ${fieldName}`);
        }
        break;
      default:
        (item as any)[fieldName] = value;
    }
  }

  // For MCQs, map question to title and normalize correct option
  if (category === 'mcq') {
    if (!item.title && (item as any).question) {
      item.title = (item as any).question;
    }
    
    // Ensure subject and topic exist in database
    if ((item as any).subject) {
      try {
        const subjectName = (item as any).subject.trim();
        const subject = await findOrCreateSubject(subjectName, 'mcq');
        if (subject && (item as any).topic) {
          const topicName = (item as any).topic.trim();
          await findOrCreateTopic(subject.id!, topicName);
        }
      } catch (error) {
        console.warn(`Failed to create subject/topic: ${error}`);
      }
    }
    
    // Normalize correct option to A-D
    if ((item as any).correctOption) {
      const correct = (item as any).correctOption.toString().toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(correct)) {
        (item as any).correctOption = correct;
      } else if (['1', '2', '3', '4'].includes(correct)) {
        // Convert 1-4 to A-D
        const mapping: Record<string, string> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
        (item as any).correctOption = mapping[correct];
      }
    }
  }

  // Validate required fields
  const requiredFields = template.filter(f => f.required);
  for (const field of requiredFields) {
    const value = item[field.name as keyof ContentSubmission] || (item as any)[field.name];
    if (!value || (typeof value === 'string' && !value.trim())) {
      throw new Error(`Missing required field: ${field.name}`);
    }
  }

  return item as ContentSubmission;
};

export const generateCSVTemplate = (category: ContentCategory): string => {
  const template = CSV_TEMPLATES[category];
  const headers = template.map(field => field.name);
  const sampleRow = template.map(field => {
    switch (field.name) {
      case 'title': return `Sample ${category} title`;
      case 'description': return `Sample description for ${category}`;
      case 'deadline': return '2024-12-31';
      case 'tags': return 'tag1,tag2,tag3';
      case 'correctOption': return 'A';
      case 'difficulty': return 'Medium';
      case 'timeLimit': return '30';
      case 'marks': return '1';
      default: return `Sample ${field.name}`;
    }
  });

  return [headers.join(','), sampleRow.join(',')].join('\n');
};
