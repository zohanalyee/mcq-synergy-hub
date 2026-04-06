import { supabase } from "@/integrations/supabase/client";
import { SyllabusItem } from "@/services/jobTestService";

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

function validateJobTestItem(item: any, index: number): string | null {
  if (!item.title || typeof item.title !== 'string') return `Item ${index + 1}: Missing or invalid 'title'`;
  if (!item.organization || typeof item.organization !== 'string') return `Item ${index + 1}: Missing or invalid 'organization'`;
  if (!item.syllabus || !Array.isArray(item.syllabus) || item.syllabus.length === 0) return `Item ${index + 1}: Missing or empty 'syllabus'`;
  for (let i = 0; i < item.syllabus.length; i++) {
    const s = item.syllabus[i];
    if (!s.topic || typeof s.topic !== 'string') return `Item ${index + 1}, Syllabus ${i + 1}: Missing 'topic'`;
    if (typeof s.percentage !== 'number' || s.percentage <= 0) return `Item ${index + 1}, Syllabus ${i + 1}: Invalid 'percentage'`;
  }
  return null;
}

export function parseJobTestsJson(data: any[]): { jobTests: JobTestImportItem[]; errors: string[] } {
  const jobTests: JobTestImportItem[] = [];
  const errors: string[] = [];
  data.forEach((item, index) => {
    const error = validateJobTestItem(item, index);
    if (error) { errors.push(error); return; }
    jobTests.push({
      title: item.title.trim(),
      description: item.description?.trim() || '',
      organization: item.organization.trim(),
      duration: Number(item.duration) || 90,
      questions: Number(item.questions) || 100,
      syllabus: item.syllabus.map((s: any) => ({ topic: s.topic.trim(), percentage: Number(s.percentage) })),
    });
  });
  return { jobTests, errors };
}

export async function bulkImportJobTests(items: JobTestImportItem[]): Promise<BulkJobTestImportResult> {
  const result: BulkJobTestImportResult = { inserted: 0, errors: [] };
  try {
    const rows = items.map((item) => ({
      title: item.title,
      description: item.description,
      organization: item.organization,
      duration: item.duration,
      questions: item.questions,
      syllabus: item.syllabus as any,
    }));

    const { data, error } = await supabase.from("job_tests").insert(rows).select();
    if (error) {
      result.errors.push("Database insert failed: " + error.message);
    } else {
      result.inserted = data?.length || 0;
    }
  } catch (error: any) {
    result.errors.push("Bulk import error: " + error.message);
  }
  return result;
}
