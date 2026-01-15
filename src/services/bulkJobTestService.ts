import { JobTest, SyllabusItem } from "@/data/jobTestsData";
import { getJobTests, saveJobTests } from "@/services/jobTestService";

export interface JobTestImportItem {
  title: string;
  description: string;
  organization: string;
  duration: number;
  questions: number;
  syllabus: SyllabusItem[];
}

export interface BulkJobTestImportResult {
  inserted: number;
  errors: string[];
}

/**
 * Validates a single job test item from JSON
 */
function validateJobTestItem(item: any, index: number): string | null {
  if (!item.title || typeof item.title !== 'string') {
    return `Item ${index + 1}: Missing or invalid 'title' field`;
  }
  if (!item.organization || typeof item.organization !== 'string') {
    return `Item ${index + 1}: Missing or invalid 'organization' field`;
  }
  if (!item.syllabus || !Array.isArray(item.syllabus) || item.syllabus.length === 0) {
    return `Item ${index + 1}: Missing or empty 'syllabus' array`;
  }
  
  // Validate each syllabus item
  for (let i = 0; i < item.syllabus.length; i++) {
    const syllabusItem = item.syllabus[i];
    if (!syllabusItem.topic || typeof syllabusItem.topic !== 'string') {
      return `Item ${index + 1}, Syllabus ${i + 1}: Missing or invalid 'topic' field`;
    }
    if (typeof syllabusItem.percentage !== 'number' || syllabusItem.percentage <= 0) {
      return `Item ${index + 1}, Syllabus ${i + 1}: Invalid 'percentage' (must be > 0)`;
    }
  }
  
  return null;
}

/**
 * Parses JSON array into JobTestImportItem objects
 */
export function parseJobTestsJson(data: any[]): { 
  jobTests: JobTestImportItem[]; 
  errors: string[] 
} {
  const jobTests: JobTestImportItem[] = [];
  const errors: string[] = [];

  data.forEach((item, index) => {
    const error = validateJobTestItem(item, index);
    if (error) {
      errors.push(error);
      return;
    }

    // Parse syllabus items
    const syllabus: SyllabusItem[] = item.syllabus.map((s: any) => ({
      topic: s.topic.trim(),
      percentage: Number(s.percentage)
    }));

    jobTests.push({
      title: item.title.trim(),
      description: item.description?.trim() || '',
      organization: item.organization.trim(),
      duration: Number(item.duration) || 90,
      questions: Number(item.questions) || 100,
      syllabus
    });
  });

  return { jobTests, errors };
}

/**
 * Bulk imports job tests to localStorage
 */
export async function bulkImportJobTests(
  items: JobTestImportItem[]
): Promise<BulkJobTestImportResult> {
  const result: BulkJobTestImportResult = {
    inserted: 0,
    errors: []
  };

  try {
    const existingJobTests = getJobTests();
    
    // Find the highest existing ID
    let maxId = existingJobTests.length > 0 
      ? Math.max(...existingJobTests.map(t => t.id)) 
      : 0;
    
    const newJobTests: JobTest[] = [];
    
    for (const item of items) {
      try {
        maxId++;
        const newJobTest: JobTest = {
          id: maxId,
          title: item.title,
          description: item.description,
          organization: item.organization,
          duration: item.duration,
          questions: item.questions,
          syllabus: item.syllabus
        };
        newJobTests.push(newJobTest);
        result.inserted++;
      } catch (error) {
        result.errors.push(`Failed to process: ${item.title}`);
      }
    }
    
    // Save all new job tests to localStorage
    if (newJobTests.length > 0) {
      const allJobTests = [...existingJobTests, ...newJobTests];
      saveJobTests(allJobTests);
    }
    
    console.log(`Bulk import complete: ${result.inserted} job tests inserted`);
  } catch (error) {
    console.error("Bulk import error:", error);
    result.errors.push("Failed to complete bulk import");
  }

  return result;
}

/**
 * Gets all existing job tests
 */
export function getExistingJobTests(): JobTest[] {
  return getJobTests();
}
