export interface EducationalSystem {
  id: string;
  name: string;
  type: 'academic' | 'job';
  description?: string;
  is_active: boolean;
  created_at: string;
  levelCount?: number;
}

export interface Level {
  id: string;
  system_id: string;
  name: string;
  order_index: number;
  created_at: string;
  subjectCount?: number;
}

export interface SyllabusImportItem {
  subject: string;
  topics: string[];
}

export interface ActiveLearningContext {
  system_id?: string;
  level_id?: string;
}
