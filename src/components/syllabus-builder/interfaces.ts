export interface SyllabusTopic {
  id: string;
  name: string;
  description?: string;
  subject_id: string;
  isSelected: boolean;
}

export interface SyllabusSubject {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  category?: string;
  level_id: string;
  levelName: string;
  systemName: string;
  topics: SyllabusTopic[];
  isExpanded: boolean;
  isSelected: boolean;
}

export interface FilterState {
  selectedSystemIds: string[];
  selectedLevelIds: string[];
  searchQuery: string;
}

export interface QuizSettings {
  timeLimit: number;
  questionsCount: number;
  difficulty: string;
}

export interface EducationalSystemWithLevels {
  id: string;
  name: string;
  type: string;
  description?: string;
  is_active: boolean;
  levels: {
    id: string;
    name: string;
    order_index: number;
  }[];
}

export interface SavedSyllabusTemplate {
  id: string;
  user_id: string;
  name: string;
  filter_state: FilterState;
  selected_topic_ids: string[];
  quiz_settings: QuizSettings;
  created_at: string;
  updated_at: string;
}
