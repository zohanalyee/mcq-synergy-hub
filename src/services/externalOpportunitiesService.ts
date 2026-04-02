import { supabase } from "@/integrations/supabase/client";
import { 
  ExternalOpportunity, 
  ExternalOpportunityInsert, 
  OpportunityStatus, 
  OpportunityType,
  ExternalOpportunityFilters,
  SectorType,
  RegionType,
  ScholarshipScope
} from "@/types/externalOpportunities";

// Fetch opportunities by status (for admin) - includes duplicate detection
export const getExternalOpportunities = async (status?: OpportunityStatus): Promise<ExternalOpportunity[]> => {
  let query = supabase
    .from('external_opportunities')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching external opportunities:', error);
    throw error;
  }
  
  return (data || []) as ExternalOpportunity[];
};

// Check if URL already exists in approved opportunities (for duplicate detection)
export const checkDuplicateUrl = async (applyUrl: string, excludeId?: string): Promise<boolean> => {
  let query = supabase
    .from('external_opportunities')
    .select('id')
    .eq('apply_url', applyUrl)
    .eq('status', 'approved');
  
  if (excludeId) {
    query = query.neq('id', excludeId);
  }
  
  const { data, error } = await query.limit(1);
  
  if (error) {
    console.error('Error checking duplicate URL:', error);
    return false;
  }
  
  return (data || []).length > 0;
};

// Get opportunities with duplicate flags
export const getExternalOpportunitiesWithDuplicates = async (status?: OpportunityStatus): Promise<(ExternalOpportunity & { isDuplicate?: boolean })[]> => {
  const opportunities = await getExternalOpportunities(status);
  
  // If checking pending, find duplicates against approved
  if (status === 'pending') {
    const { data: approved } = await supabase
      .from('external_opportunities')
      .select('apply_url')
      .eq('status', 'approved');
    
    const approvedUrls = new Set((approved || []).map(a => a.apply_url));
    
    return opportunities.map(opp => ({
      ...opp,
      isDuplicate: approvedUrls.has(opp.apply_url)
    }));
  }
  
  return opportunities;
};

// Get approved opportunities for public pages with optional filters
export const getApprovedOpportunities = async (
  type: OpportunityType,
  filters?: ExternalOpportunityFilters
): Promise<ExternalOpportunity[]> => {
  let query = supabase
    .from('external_opportunities')
    .select('*')
    .in('status', ['approved', 'pending'])
    .eq('type', type);
  
  // Apply filters
  if (filters?.sector && filters.sector !== 'all') {
    query = query.eq('sector', filters.sector);
  }
  if (filters?.region && filters.region !== 'all') {
    query = query.eq('region', filters.region);
  }
  if (filters?.scholarship_scope && filters.scholarship_scope !== 'all') {
    query = query.eq('scholarship_scope', filters.scholarship_scope);
  }
  
  const { data, error } = await query.order('deadline_date', { ascending: true });
  
  if (error) {
    console.error('Error fetching approved opportunities:', error);
    throw error;
  }
  
  return (data || []) as ExternalOpportunity[];
};

// Update opportunity status (approve/reject)
export const updateOpportunityStatus = async (
  id: string,
  status: 'approved' | 'rejected',
  reviewerId: string
): Promise<ExternalOpportunity | null> => {
  const { data, error } = await supabase
    .from('external_opportunities')
    .update({
      status,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating opportunity status:', error);
    throw error;
  }
  
  return data as ExternalOpportunity;
};

// Update opportunity sector/region tags
export const updateOpportunityTags = async (
  id: string,
  updates: {
    sector?: SectorType | null;
    region?: RegionType | null;
    scholarship_scope?: ScholarshipScope | null;
  }
): Promise<ExternalOpportunity | null> => {
  const { data, error } = await supabase
    .from('external_opportunities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating opportunity tags:', error);
    throw error;
  }
  
  return data as ExternalOpportunity;
};

// Get counts by status (for admin dashboard)
export const getOpportunityCounts = async (): Promise<Record<OpportunityStatus, number>> => {
  const { data, error } = await supabase
    .from('external_opportunities')
    .select('status');
  
  if (error) {
    console.error('Error fetching opportunity counts:', error);
    throw error;
  }
  
  const counts: Record<OpportunityStatus, number> = {
    pending: 0,
    approved: 0,
    rejected: 0
  };
  
  (data || []).forEach((item: { status: OpportunityStatus }) => {
    counts[item.status]++;
  });
  
  return counts;
};

// Sync AI-generated opportunities via edge function
export const syncAIExternalData = async (searchType: 'jobs' | 'scholarships' = 'jobs'): Promise<{ 
  success: boolean;
  added: number; 
  duplicates: number;
  total_parsed?: number;
  error?: string;
}> => {
  const { data, error } = await supabase.functions.invoke('fetch-external-jobs', {
    body: { searchType }
  });
  
  if (error) {
    console.error('Error calling fetch-external-jobs:', error);
    throw error;
  }
  
  return data;
};

// Mock data for testing the sync feature (kept for backward compatibility)
const mockOpportunities: ExternalOpportunityInsert[] = [
  {
    title: "Software Engineer at Tech Corp",
    description: "Join our growing engineering team to build scalable web applications. Requirements: 3+ years experience with React, Node.js, and cloud services.",
    apply_url: "https://linkedin.com/jobs/software-engineer-tech-corp-12345",
    image_url: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400",
    source_name: "LinkedIn",
    type: "job",
    deadline_date: "2026-02-15",
    organization: "Tech Corp Inc.",
    location: "Karachi",
    sector: "private",
    region: "sindh"
  },
  {
    title: "HEC Indigenous Scholarship 2026",
    description: "Full scholarship for PhD students in STEM fields. Covers tuition, living expenses, and research grants for up to 4 years.",
    apply_url: "https://hec.gov.pk/scholarships/indigenous-2026",
    image_url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400",
    source_name: "HEC",
    type: "scholarship",
    deadline_date: "2026-03-01",
    organization: "Higher Education Commission",
    location: "Pakistan",
    scholarship_scope: "national",
    region: "federal"
  },
  {
    title: "FPSC CSS Examination 2026",
    description: "Central Superior Services examination for federal government positions. Multiple posts available across various ministries.",
    apply_url: "https://fpsc.gov.pk/css-2026",
    image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400",
    source_name: "FPSC",
    type: "job",
    deadline_date: "2026-02-28",
    organization: "Federal Public Service Commission",
    location: "Islamabad",
    sector: "government",
    region: "federal"
  },
  {
    title: "Fulbright Scholarship Program",
    description: "Prestigious scholarship for graduate studies in the United States. Open to students from all disciplines.",
    apply_url: "https://fulbright.org/apply/2026-program",
    image_url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400",
    source_name: "Fulbright",
    type: "scholarship",
    deadline_date: "2026-04-15",
    organization: "Fulbright Commission",
    location: "United States",
    scholarship_scope: "international",
    region: "international"
  }
];

// Sync mock external data (for testing)
export const syncMockExternalData = async (): Promise<{ added: number; duplicates: number }> => {
  let added = 0;
  let duplicates = 0;
  
  for (const opportunity of mockOpportunities) {
    try {
      const { error } = await supabase
        .from('external_opportunities')
        .insert(opportunity);
      
      if (error) {
        // Check if it's a duplicate (unique constraint violation)
        if (error.code === '23505') {
          duplicates++;
        } else {
          console.error('Error inserting opportunity:', error);
        }
      } else {
        added++;
      }
    } catch (err) {
      console.error('Error syncing opportunity:', err);
    }
  }
  
  return { added, duplicates };
};

// Delete an opportunity (admin only)
export const deleteOpportunity = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('external_opportunities')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting opportunity:', error);
    throw error;
  }
  
  return true;
};
