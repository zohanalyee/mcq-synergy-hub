import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ReactNode } from 'react';
import { 
  FileText, BookOpen, Atom, FlaskConical, Calculator, Globe, 
  Languages, History, Scale, Brain, Heart, Leaf, Cpu, Building,
  TrendingUp, Users, Gavel, Music, Palette
} from 'lucide-react';

// Subject display format for SubjectCard
export interface SubjectDisplay {
  id: string;
  title: string;
  description: string;
  category: string;
  topicCount: number;
  color: string;
  purpose: "reading" | "mcqs";
  levelId: string;
  levelName: string;
  systemId: string;
  systemName: string;
  icon: ReactNode;
}

export interface LevelWithSystem {
  id: string;
  name: string;
  systemId: string;
  systemName: string;
  order_index: number;
}

export interface SystemWithLevels {
  id: string;
  name: string;
  type: 'academic' | 'job';
  is_active: boolean;
  levels: { id: string; name: string; order_index: number }[];
}

interface FilterState {
  selectedSystemIds: string[];
  selectedLevelIds: string[];
  searchQuery: string;
}

// Color palette for subjects based on category/name
const getSubjectColor = (name: string, category?: string): string => {
  const colorMap: Record<string, string> = {
    'physics': '#3b82f6',
    'chemistry': '#10b981',
    'biology': '#22c55e',
    'mathematics': '#8b5cf6',
    'math': '#8b5cf6',
    'english': '#f59e0b',
    'urdu': '#ef4444',
    'islamiat': '#14b8a6',
    'pakistan studies': '#6366f1',
    'computer': '#06b6d4',
    'economics': '#ec4899',
    'geography': '#84cc16',
    'history': '#f97316',
    'civics': '#a855f7',
    'general knowledge': '#0ea5e9',
    'science': '#22d3ee'
  };

  const lowerName = name.toLowerCase();
  for (const [key, color] of Object.entries(colorMap)) {
    if (lowerName.includes(key)) return color;
  }

  // Fallback colors based on first letter
  const fallbackColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  return fallbackColors[name.charCodeAt(0) % fallbackColors.length];
};

// Get icon based on subject name
const getSubjectIcon = (name: string): ReactNode => {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('physics')) return <Atom className="h-5 w-5" />;
  if (lowerName.includes('chemistry')) return <FlaskConical className="h-5 w-5" />;
  if (lowerName.includes('biology')) return <Leaf className="h-5 w-5" />;
  if (lowerName.includes('math')) return <Calculator className="h-5 w-5" />;
  if (lowerName.includes('english')) return <Languages className="h-5 w-5" />;
  if (lowerName.includes('urdu')) return <BookOpen className="h-5 w-5" />;
  if (lowerName.includes('islamiat')) return <BookOpen className="h-5 w-5" />;
  if (lowerName.includes('pakistan') || lowerName.includes('studies')) return <Globe className="h-5 w-5" />;
  if (lowerName.includes('computer') || lowerName.includes('it')) return <Cpu className="h-5 w-5" />;
  if (lowerName.includes('economics')) return <TrendingUp className="h-5 w-5" />;
  if (lowerName.includes('geography')) return <Globe className="h-5 w-5" />;
  if (lowerName.includes('history')) return <History className="h-5 w-5" />;
  if (lowerName.includes('civics') || lowerName.includes('law')) return <Gavel className="h-5 w-5" />;
  if (lowerName.includes('psychology')) return <Brain className="h-5 w-5" />;
  if (lowerName.includes('sociology')) return <Users className="h-5 w-5" />;
  if (lowerName.includes('health')) return <Heart className="h-5 w-5" />;
  if (lowerName.includes('art')) return <Palette className="h-5 w-5" />;
  if (lowerName.includes('music')) return <Music className="h-5 w-5" />;
  if (lowerName.includes('business') || lowerName.includes('commerce')) return <Building className="h-5 w-5" />;
  if (lowerName.includes('science')) return <FlaskConical className="h-5 w-5" />;
  if (lowerName.includes('general')) return <BookOpen className="h-5 w-5" />;
  
  return <FileText className="h-5 w-5" />;
};

export const useSubjectsPageData = () => {
  const [systems, setSystems] = useState<SystemWithLevels[]>([]);
  const [rawSubjects, setRawSubjects] = useState<SubjectDisplay[]>([]);
  const [subjectMcqCounts, setSubjectMcqCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filterState, setFilterState] = useState<FilterState>({
    selectedSystemIds: [],
    selectedLevelIds: [],
    searchQuery: ''
  });

  // Fetch all educational systems with their levels
  const fetchSystems = async () => {
    try {
      const { data: systemsData, error: systemsError } = await supabase
        .from('educational_systems')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (systemsError) throw systemsError;

      const systemsWithLevels: SystemWithLevels[] = [];
      
      for (const system of systemsData || []) {
        const { data: levelsData } = await supabase
          .from('levels')
          .select('id, name, order_index')
          .eq('system_id', system.id)
          .order('order_index');

        systemsWithLevels.push({
          id: system.id,
          name: system.name,
          type: system.type as 'academic' | 'job',
          is_active: system.is_active,
          levels: levelsData || []
        });
      }

      setSystems(systemsWithLevels);
    } catch (err) {
      console.error('Error fetching systems:', err);
      setError('Failed to load educational systems');
    }
  };

  // Fetch all subjects with their topics (LMS-assigned only)
  const fetchSubjects = async () => {
    try {
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select(`
          id,
          name,
          description,
          icon,
          category,
          level_id,
          levels!inner (
            id,
            name,
            system_id,
            educational_systems!inner (
              id,
              name
            )
          )
        `)
        .not('level_id', 'is', null)
        .order('name');

      if (subjectsError) throw subjectsError;

      // Get topic counts + topic->subject map for each subject
      const { data: topicRows, error: topicError } = await supabase
        .from('topics')
        .select('id, subject_id');

      if (topicError) throw topicError;

      // Count topics per subject + build topic->subject map for MCQ aggregation
      const topicCountMap: Record<string, number> = {};
      const topicToSubject: Record<string, string> = {};
      (topicRows || []).forEach((t: any) => {
        if (!t.subject_id) return;
        topicCountMap[t.subject_id] = (topicCountMap[t.subject_id] || 0) + 1;
        topicToSubject[t.id] = t.subject_id;
      });

      // Aggregate MCQ counts per subject (lightweight: just pull topic_id refs)
      const mcqCountMap: Record<string, number> = {};
      try {
        const { data: qRows } = await (supabase as any)
          .from('questions')
          .select('topic_id')
          .not('topic_id', 'is', null);
        ((qRows as Array<{ topic_id: string | null }>) || []).forEach((q) => {
          if (!q.topic_id) return;
          const subjId = topicToSubject[q.topic_id];
          if (subjId) mcqCountMap[subjId] = (mcqCountMap[subjId] || 0) + 1;
        });
      } catch (e) {
        // MCQ counts are non-critical — fail silently
        console.warn('Could not aggregate subject MCQ counts:', e);
      }
      setSubjectMcqCounts(mcqCountMap);

      // Map to SubjectDisplay format
      const subjects: SubjectDisplay[] = (subjectsData || []).map((subject: any) => {
        const levelData = subject.levels;
        const systemData = levelData?.educational_systems;
        
        return {
          id: subject.id,
          title: subject.name,
          description: subject.description || `Learn ${subject.name} with interactive content and MCQs`,
          category: `${systemData?.name || 'General'} - ${levelData?.name || 'All Levels'}`,
          topicCount: topicCountMap[subject.id] || 0,
          color: getSubjectColor(subject.name, subject.category),
          purpose: "mcqs" as const,
          levelId: subject.level_id,
          levelName: levelData?.name || '',
          systemId: systemData?.id || '',
          systemName: systemData?.name || '',
          icon: getSubjectIcon(subject.name)
        };
      });

      setRawSubjects(subjects);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to load subjects');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSystems(), fetchSubjects()]);
      setLoading(false);
    };

    loadData();
  }, []);

  // Get available levels based on selected systems
  const availableLevels = useMemo((): LevelWithSystem[] => {
    if (filterState.selectedSystemIds.length === 0) {
      return systems.flatMap(s => 
        s.levels.map(l => ({ 
          ...l, 
          systemName: s.name, 
          systemId: s.id 
        }))
      );
    }
    return systems
      .filter(s => filterState.selectedSystemIds.includes(s.id))
      .flatMap(s => 
        s.levels.map(l => ({ 
          ...l, 
          systemName: s.name, 
          systemId: s.id 
        }))
      );
  }, [systems, filterState.selectedSystemIds]);

  // Filter subjects based on selections and search
  const filteredSubjects = useMemo(() => {
    return rawSubjects.filter(subject => {
      // Filter by system
      const systemMatch = filterState.selectedSystemIds.length === 0 || 
        filterState.selectedSystemIds.includes(subject.systemId);
      
      // Filter by level
      const levelMatch = filterState.selectedLevelIds.length === 0 || 
        filterState.selectedLevelIds.includes(subject.levelId);
      
      // Filter by search query
      const searchLower = filterState.searchQuery.toLowerCase();
      const searchMatch = filterState.searchQuery === '' ||
        subject.title.toLowerCase().includes(searchLower) ||
        subject.description.toLowerCase().includes(searchLower) ||
        subject.category.toLowerCase().includes(searchLower);
      
      return systemMatch && levelMatch && searchMatch;
    });
  }, [rawSubjects, filterState]);

  // Filter manipulation functions
  const toggleSystemFilter = (systemId: string) => {
    setFilterState(prev => {
      const isSelected = prev.selectedSystemIds.includes(systemId);
      const newSystemIds = isSelected
        ? prev.selectedSystemIds.filter(id => id !== systemId)
        : [...prev.selectedSystemIds, systemId];
      
      // When deselecting a system, also deselect its levels
      const system = systems.find(s => s.id === systemId);
      const systemLevelIds = system?.levels.map(l => l.id) || [];
      const newLevelIds = isSelected
        ? prev.selectedLevelIds.filter(id => !systemLevelIds.includes(id))
        : prev.selectedLevelIds;

      return {
        ...prev,
        selectedSystemIds: newSystemIds,
        selectedLevelIds: newLevelIds
      };
    });
  };

  const toggleLevelFilter = (levelId: string) => {
    setFilterState(prev => ({
      ...prev,
      selectedLevelIds: prev.selectedLevelIds.includes(levelId)
        ? prev.selectedLevelIds.filter(id => id !== levelId)
        : [...prev.selectedLevelIds, levelId]
    }));
  };

  const setSearchQuery = (query: string) => {
    setFilterState(prev => ({ ...prev, searchQuery: query }));
  };

  const clearFilters = () => {
    setFilterState({
      selectedSystemIds: [],
      selectedLevelIds: [],
      searchQuery: ''
    });
  };

  const isFiltered = filterState.searchQuery !== '' || 
    filterState.selectedSystemIds.length > 0 || 
    filterState.selectedLevelIds.length > 0;

  return {
    systems,
    availableLevels,
    subjects: filteredSubjects,
    rawSubjects,
    subjectMcqCounts,
    loading,
    error,
    filterState,
    toggleSystemFilter,
    toggleLevelFilter,
    setSearchQuery,
    clearFilters,
    isFiltered,
    totalCount: rawSubjects.length
  };
};
