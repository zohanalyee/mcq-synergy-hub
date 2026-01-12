import { supabase } from "@/integrations/supabase/client";

export interface JobImportItem {
  title: string;
  department: string;
  location?: string;
  deadline?: string;
  description?: string;
  apply_link?: string;
  government_level?: string;
  cadre?: string;
  tags?: string[];
}

export interface BulkJobImportResult {
  inserted: number;
  errors: string[];
}

export const validateJobItem = (item: any, index: number): string | null => {
  if (!item.title || typeof item.title !== 'string' || item.title.trim() === '') {
    return `Item ${index + 1}: Missing or invalid "title" field`;
  }
  if (!item.department || typeof item.department !== 'string' || item.department.trim() === '') {
    return `Item ${index + 1}: Missing or invalid "department" field`;
  }
  return null;
};

export const parseJobsJson = (data: any[]): { jobs: JobImportItem[]; errors: string[] } => {
  const jobs: JobImportItem[] = [];
  const errors: string[] = [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const error = validateJobItem(item, i);
    if (error) {
      errors.push(error);
      continue;
    }

    jobs.push({
      title: item.title.trim(),
      department: item.department.trim(),
      location: item.location?.trim() || null,
      deadline: item.deadline || null,
      description: item.description?.trim() || null,
      apply_link: item.apply_link?.trim() || null,
      government_level: item.government_level?.trim() || null,
      cadre: item.cadre?.trim() || null,
      tags: Array.isArray(item.tags) ? item.tags : [],
    });
  }

  return { jobs, errors };
};

export const bulkImportJobs = async (jobs: JobImportItem[]): Promise<BulkJobImportResult> => {
  const errors: string[] = [];
  let inserted = 0;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Prepare batch insert data
    const insertData = jobs.map((job) => ({
      title: job.title,
      description: job.description || '',
      category: 'job',
      status: 'approved',
      department: job.department,
      location: job.location,
      deadline: job.deadline,
      apply_link: job.apply_link,
      government_level: job.government_level,
      cadre: job.cadre,
      tags: job.tags || [],
      created_by: user?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Insert in batches of 50 to avoid timeouts
    const batchSize = 50;
    for (let i = 0; i < insertData.length; i += batchSize) {
      const batch = insertData.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('content_items')
        .insert(batch)
        .select();

      if (error) {
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        console.error('Batch insert error:', error);
      } else {
        inserted += data?.length || 0;
      }
    }

    return { inserted, errors };
  } catch (error: any) {
    console.error('Bulk import error:', error);
    errors.push(`Import failed: ${error.message}`);
    return { inserted, errors };
  }
};

export const getJobsContent = async () => {
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('category', 'job')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }

  return data || [];
};
