import { supabase } from "@/integrations/supabase/client";

export interface ScholarshipImportItem {
  title: string;
  institution: string;
  scholarship_type?: string;
  deadline?: string;
  description?: string;
  apply_link?: string;
  tags?: string[];
}

export interface BulkScholarshipImportResult {
  inserted: number;
  errors: string[];
}

export const validateScholarshipItem = (item: any, index: number): string | null => {
  if (!item.title || typeof item.title !== 'string' || item.title.trim() === '') {
    return `Item ${index + 1}: Missing or invalid "title" field`;
  }
  if (!item.institution || typeof item.institution !== 'string' || item.institution.trim() === '') {
    return `Item ${index + 1}: Missing or invalid "institution" field`;
  }
  return null;
};

export const parseScholarshipsJson = (data: any[]): { scholarships: ScholarshipImportItem[]; errors: string[] } => {
  const scholarships: ScholarshipImportItem[] = [];
  const errors: string[] = [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const error = validateScholarshipItem(item, i);
    if (error) {
      errors.push(error);
      continue;
    }

    scholarships.push({
      title: item.title.trim(),
      institution: item.institution.trim(),
      scholarship_type: item.scholarship_type?.trim() || item.type?.trim() || null,
      deadline: item.deadline || null,
      description: item.description?.trim() || null,
      apply_link: item.apply_link?.trim() || item.applyLink?.trim() || null,
      tags: Array.isArray(item.tags) ? item.tags : [],
    });
  }

  return { scholarships, errors };
};

export const bulkImportScholarships = async (scholarships: ScholarshipImportItem[]): Promise<BulkScholarshipImportResult> => {
  const errors: string[] = [];
  let inserted = 0;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Prepare batch insert data
    const insertData = scholarships.map((scholarship) => ({
      title: scholarship.title,
      description: scholarship.description || '',
      category: 'scholarship',
      status: 'approved',
      institution: scholarship.institution,
      scholarship_type: scholarship.scholarship_type,
      deadline: scholarship.deadline,
      apply_link: scholarship.apply_link,
      tags: scholarship.tags || [],
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
    console.error('Bulk scholarship import error:', error);
    errors.push(`Import failed: ${error.message}`);
    return { inserted, errors };
  }
};

export const getScholarshipsContent = async () => {
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('category', 'scholarship')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching scholarships:', error);
    return [];
  }

  return data || [];
};
