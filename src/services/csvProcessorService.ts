import { ContentItem, ContentCategory, ContentSubmission } from "@/interfaces/content";
import { v4 as uuidv4 } from 'uuid';

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

// Helper function to normalize header names
const normalizeHeader = (header: string): string => {
  return header.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/^option([abcd])$/, 'option$1')
    .replace(/^correctanswer$/, 'correctoption')
    .replace(/^answer$/, 'correctoption');
};

export const parseCSV = (csvContent: string, category: ContentCategory): CSVProcessingResult => {
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

    // Normalize headers and create index map
    const rawHeaders = lines[0].split(',').map(h => h.trim());
    const normalizedHeaders = rawHeaders.map(normalizeHeader);
    const template = CSV_TEMPLATES[category];
    
    // Create header index mapping
    const headerIndexMap: Record<string, number> = {};
    for (let i = 0; i < normalizedHeaders.length; i++) {
      const normalized = normalizedHeaders[i];
      const templateField = template.find(f => 
        normalizeHeader(f.name) === normalized ||
        f.name.toLowerCase() === normalized
      );
      if (templateField) {
        headerIndexMap[templateField.name] = i;
      }
    }
    
    // Validate required fields - skip title/description for MCQs
    const requiredFields = template.filter(field => field.required);
    const missingRequired = requiredFields.filter(field => 
      !(field.name in headerIndexMap)
    );
    
    if (missingRequired.length > 0) {
      result.errors.push(`Missing required fields: ${missingRequired.map(f => f.name).join(', ')}`);
      return result;
    }

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      try {
        const values = line.split(',').map(v => v.trim());
        const item = processCSVRow(headerIndexMap, values, category, template);
        
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

const processCSVRow = (
  headerIndexMap: Record<string, number>, 
  values: string[], 
  category: ContentCategory,
  template: CSVField[]
): ContentSubmission | null => {
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

  // For MCQs, map question to title if no title exists
  if (category === 'mcq' && !item.title && (item as any).question) {
    item.title = (item as any).question;
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
