
export type ContentCategory = 'scholarship' | 'job' | 'mcq' | 'past_paper';

export type ContentStatus = 'pending' | 'approved' | 'rejected';

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  category: ContentCategory;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  status: ContentStatus;
  createdBy: string;
  imageUrl?: string;
  fileUrl?: string;
  deadline?: string;
  department?: string;
  governmentLevel?: string;
  cadre?: string;
  scholarshipType?: string;
  institution?: string;
  examType?: string;
  examYear?: string;
}

export interface ContentSubmission {
  title: string;
  description: string;
  category: ContentCategory;
  tags: string[];
  imageFile?: File;
  documentFile?: File;
  deadline?: string;
  department?: string;
  governmentLevel?: string;
  cadre?: string;
  scholarshipType?: string;
  institution?: string;
  examType?: string;
  examYear?: string;
}
