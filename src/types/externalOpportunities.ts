export type OpportunityType = 'job' | 'scholarship';
export type OpportunityStatus = 'pending' | 'approved' | 'rejected';

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
  metadata?: Record<string, any>;
}
