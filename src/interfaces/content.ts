
export type ContentCategory = 'scholarship' | 'job' | 'mcq';

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
}

export interface ContentSubmission {
  title: string;
  description: string;
  category: ContentCategory;
  tags: string[];
  imageFile?: File;
  documentFile?: File;
}
