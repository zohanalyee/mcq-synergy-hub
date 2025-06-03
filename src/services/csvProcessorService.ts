
import { ContentItem, ContentCategory, ContentSubmission } from "@/interfaces/content";
import { v4 as uuidv4 } from 'uuid';

export interface CSVProcessingResult {
  items: ContentSubmission[];
  errors: string[];
  warnings: string[];
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
  cv: [
    { name: 'title', required: true, type: 'string', description: 'CV title/position' },
    { name: 'candidateName', required: true, type: 'string', description: 'Candidate name' },
    { name: 'description', required: true, type: 'string', description: 'Brief summary' },
    { name: 'experience', required: false, type: 'string', description: 'Work experience' },
    { name: 'skills', required: false, type: 'string', description: 'Skills and competencies' },
    { name: 'education', required: false, type: 'string', description: 'Educational background' },
    { name: 'contactInfo', required: false, type: 'string', description: 'Contact information' },
    { name: 'tags', required: false, type: 'array', description: 'Comma-separated tags' },
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

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const template = CSV_TEMPLATES[category];
    
    // Validate headers
    const requiredFields = template.filter(field => field.required);
    const missingRequired = requiredFields.filter(field => 
      !headers.includes(field.name.toLowerCase())
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
        const item = processCSVRow(headers, values, category, template);
        
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
  headers: string[], 
  values: string[], 
  category: ContentCategory,
  template: CSVField[]
): ContentSubmission | null => {
  const item: Partial<ContentSubmission> = {
    category,
    tags: []
  };

  for (let i = 0; i < headers.length && i < values.length; i++) {
    const header = headers[i];
    const value = values[i];
    
    if (!value) continue;

    const field = template.find(f => f.name.toLowerCase() === header);
    if (!field) continue;

    switch (field.type) {
      case 'array':
        item[header as keyof ContentSubmission] = value.split(',').map(v => v.trim());
        break;
      case 'number':
        item[header as keyof ContentSubmission] = parseInt(value) || 0;
        break;
      case 'date':
        item[header as keyof ContentSubmission] = value;
        break;
      default:
        item[header as keyof ContentSubmission] = value;
    }
  }

  // Validate required fields
  const requiredFields = template.filter(f => f.required);
  for (const field of requiredFields) {
    if (!item[field.name as keyof ContentSubmission]) {
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
