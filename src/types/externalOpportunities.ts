export type OpportunityType = 'job' | 'scholarship' | 'tender';
export type OpportunityStatus = 'pending' | 'approved' | 'rejected';
export type SectorType = 'government' | 'private';
export type RegionType = 'sindh' | 'punjab' | 'kpk' | 'balochistan' | 'federal' | 'international' | 'other';
export type ScholarshipScope = 'national' | 'international';

export interface ExternalOpportunity {
  id: string;
  title: string;
  description: string | null;
  apply_url: string;
  image_url: string | null;
  source_name: string;
  type: OpportunityType;
  status: OpportunityStatus;
  deadline_date: string | null;
  location: string | null;
  organization: string | null;
  sector: SectorType | null;
  region: RegionType | null;
  scholarship_scope: ScholarshipScope | null;
  tender_number: string | null;
  tender_value: string | null;
  tender_category: string | null;
  document_url: string | null;
  pre_bid_meeting: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export interface ExternalOpportunityInsert {
  title: string;
  description?: string;
  apply_url: string;
  image_url?: string;
  source_name: string;
  type: OpportunityType;
  status?: OpportunityStatus;
  deadline_date?: string;
  location?: string;
  organization?: string;
  sector?: SectorType;
  region?: RegionType;
  scholarship_scope?: ScholarshipScope;
  metadata?: Record<string, any>;
}

export interface ExternalOpportunityFilters {
  sector?: SectorType | 'all';
  region?: RegionType | 'all';
  scholarship_scope?: ScholarshipScope | 'all';
}
