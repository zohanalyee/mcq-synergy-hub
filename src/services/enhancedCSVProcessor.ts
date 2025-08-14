
import { ContentCategory, ContentSubmission } from "@/interfaces/content";
import { supabase } from "@/integrations/supabase/client";

export interface CSVProcessingResult {
  items: any[];
  errors: string[];
  warnings: string[];
  fileName?: string;
}

// Helper function to parse and validate dates
const parseDate = (dateStr: string): string | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  try {
    // Try various date formats
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      // Try parsing common formats like DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
      const formats = [
        /^\d{1,2}\/\d{1,2}\/\d{4}$/, // DD/MM/YYYY or MM/DD/YYYY
        /^\d{4}-\d{1,2}-\d{1,2}$/, // YYYY-MM-DD
        /^\d{1,2}-\d{1,2}-\d{4}$/, // DD-MM-YYYY or MM-DD-YYYY
      ];
      
      for (const format of formats) {
        if (format.test(dateStr)) {
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString();
          }
        }
      }
      return null;
    }
    return date.toISOString();
  } catch {
    return null;
  }
};

export const processCSVForDatabase = async (
  content: string,
  category: ContentCategory
): Promise<CSVProcessingResult> => {
  const result: CSVProcessingResult = {
    items: [],
    errors: [],
    warnings: []
  };

  try {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      result.errors.push('CSV file must contain header and at least one data row');
      return result;
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        if (values.length === 0) continue;

        const item = await processCSVRow(headers, values, category, i + 1);
        if (item) {
          result.items.push(item);
        }
      } catch (error) {
        result.errors.push(`Row ${i + 1}: ${error}`);
      }
    }

  } catch (error) {
    result.errors.push(`Failed to process CSV: ${error}`);
  }

  return result;
};

const parseCSVLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values.map(v => v.replace(/^"|"$/g, ''));
};

const processCSVRow = async (
  headers: string[],
  values: string[],
  category: ContentCategory,
  rowNumber: number
): Promise<any> => {
  const data: any = {};
  
  // Map CSV columns to data object
  headers.forEach((header, index) => {
    if (values[index]) {
      data[header.toLowerCase().replace(/\s+/g, '_')] = values[index];
    }
  });

  // Validate required fields
  if (!data.title) {
    throw new Error('Title is required');
  }

  // For MCQ items, map question to title if title is missing
  if (category === 'mcq' && !data.title && data.question) {
    data.title = data.question;
  }

  // Create base content item for database (using snake_case for database fields)
  const contentItem = {
    title: data.title,
    description: data.description || (category === 'mcq' ? data.question || '' : ''),
    category: category,
    tags: data.tags ? data.tags.split(';').map((t: string) => t.trim()) : [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null, // Will be set during actual submission
    status: 'pending'
  };

  // Add category-specific fields with proper snake_case mapping and date validation
  if (category === 'scholarship') {
    const deadline = parseDate(data.deadline);
    Object.assign(contentItem, {
      deadline: deadline,
      scholarship_type: data.scholarship_type || data.type || null,
      institution: data.institution || null
    });
    
    // Add warning for invalid deadline
    if (data.deadline && !deadline) {
      throw new Error(`Invalid deadline format: "${data.deadline}". Use YYYY-MM-DD or DD/MM/YYYY format.`);
    }
  } else if (category === 'job') {
    const deadline = parseDate(data.deadline);
    Object.assign(contentItem, {
      deadline: deadline,
      department: data.department || null,
      government_level: data.government_level || data.level || null,
      cadre: data.cadre || null
    });
    
    // Add warning for invalid deadline
    if (data.deadline && !deadline) {
      throw new Error(`Invalid deadline format: "${data.deadline}". Use YYYY-MM-DD or DD/MM/YYYY format.`);
    }
  } else if (category === 'mcq') {
    // For MCQ, validate required fields
    if (!data.question) throw new Error('Question is required for MCQ');
    if (!data.option_a) throw new Error('Option A is required for MCQ');
    if (!data.option_b) throw new Error('Option B is required for MCQ');
    if (!data.option_c) throw new Error('Option C is required for MCQ');
    if (!data.option_d) throw new Error('Option D is required for MCQ');
    if (!data.correct_option) throw new Error('Correct option is required for MCQ');

    Object.assign(contentItem, {
      subject: data.subject || null,
      topic: data.topic || null,
      options: {
        A: data.option_a,
        B: data.option_b,
        C: data.option_c,
        D: data.option_d
      },
      correct_option: data.correct_option.toUpperCase(),
      difficulty: data.difficulty || 'Medium',
      explanation: data.explanation || '',
      description: data.question // Store question in description field
    });
  } else if (category === 'quiz') {
    Object.assign(contentItem, {
      subject: data.subject || null,
      topic: data.topic || null,
      time_limit: data.time_limit ? parseInt(data.time_limit) : 30,
      marks: data.marks ? parseInt(data.marks) : 10
    });
  } else if (category === 'past_paper') {
    Object.assign(contentItem, {
      exam_type: data.exam_type || null,
      exam_year: data.exam_year || null,
      subject: data.subject || null
    });
  }

  // Store original question for MCQ items
  if (category === 'mcq' && data.question) {
    (contentItem as any).question = data.question;
  }

  return contentItem;
};

export const submitCSVItemsToDatabase = async (
  items: any[],
  userId: string | null
): Promise<{ success: number; errors: string[] }> => {
  const result = { success: 0, errors: [] };

  for (const item of items) {
    try {
      // Set the created_by field
      const itemWithUser = {
        ...item,
        created_by: userId
      };

      const { error } = await supabase
        .from('content_items')
        .insert([itemWithUser]);

      if (error) {
        console.error('Supabase insert error:', error);
        result.errors.push(`Failed to insert item "${item.title}": ${error.message}`);
      } else {
        result.success++;
      }
    } catch (error) {
      console.error('Processing error:', error);
      result.errors.push(`Error processing item "${item.title}": ${error}`);
    }
  }

  return result;
};

export const generateCSVTemplate = (category: ContentCategory): string => {
  const baseHeaders = ['title', 'description', 'tags'];
  
  let headers: string[] = [...baseHeaders];
  
  switch (category) {
    case 'scholarship':
      headers.push('deadline', 'scholarship_type', 'institution');
      break;
    case 'job':
      headers.push('deadline', 'department', 'government_level', 'cadre');
      break;
    case 'mcq':
      headers.push('question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option', 'subject', 'topic', 'difficulty', 'explanation');
      break;
    case 'quiz':
      headers.push('subject', 'topic', 'time_limit', 'marks');
      break;
    case 'past_paper':
      headers.push('exam_type', 'exam_year', 'subject');
      break;
  }
  
  return headers.join(',') + '\n';
};
