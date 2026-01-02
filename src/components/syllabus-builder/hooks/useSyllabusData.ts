import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SyllabusSubject, SyllabusTopic, FilterState, EducationalSystemWithLevels } from '../interfaces';

export const useSyllabusData = () => {
  const [systems, setSystems] = useState<EducationalSystemWithLevels[]>([]);
  const [rawSubjects, setRawSubjects] = useState<SyllabusSubject[]>([]);
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

      // Fetch levels for each system
      const systemsWithLevels: EducationalSystemWithLevels[] = [];
      
      for (const system of systemsData || []) {
        const { data: levelsData } = await supabase
          .from('levels')
          .select('id, name, order_index')
          .eq('system_id', system.id)
          .order('order_index');

        systemsWithLevels.push({
          ...system,
          levels: levelsData || []
        });
      }

      setSystems(systemsWithLevels);
    } catch (err) {
      console.error('Error fetching systems:', err);
      setError('Failed to load educational systems');
    }
  };

  // Fetch all subjects with their topics
  const fetchSubjects = async () => {
    try {
      // First get subjects with level info
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

      // Fetch all topics
      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select('id, name, description, subject_id')
        .order('name');

      if (topicsError) throw topicsError;

      // Map subjects with their topics
      const subjects: SyllabusSubject[] = (subjectsData || []).map((subject: any) => {
        const subjectTopics = (topicsData || [])
          .filter((t: any) => t.subject_id === subject.id)
          .map((t: any): SyllabusTopic => ({
            id: t.id,
            name: t.name,
            description: t.description,
            subject_id: t.subject_id,
            isSelected: false
          }));

        return {
          id: subject.id,
          name: subject.name,
          description: subject.description,
          icon: subject.icon,
          category: subject.category,
          level_id: subject.level_id,
          levelName: subject.levels?.name || '',
          systemName: subject.levels?.educational_systems?.name || '',
          topics: subjectTopics,
          isExpanded: false,
          isSelected: false
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
  const availableLevels = useMemo(() => {
    if (filterState.selectedSystemIds.length === 0) {
      // Show all levels from all systems
      return systems.flatMap(s => s.levels.map(l => ({ ...l, systemName: s.name, systemId: s.id })));
    }
    // Show only levels from selected systems
    return systems
      .filter(s => filterState.selectedSystemIds.includes(s.id))
      .flatMap(s => s.levels.map(l => ({ ...l, systemName: s.name, systemId: s.id })));
  }, [systems, filterState.selectedSystemIds]);

  // Filter subjects based on selected levels and search query
  const filteredSubjects = useMemo(() => {
    return rawSubjects.filter(subject => {
      // Filter by level
      const levelMatch = filterState.selectedLevelIds.length === 0 || 
        filterState.selectedLevelIds.includes(subject.level_id);
      
      // Filter by search query
      const searchLower = filterState.searchQuery.toLowerCase();
      const searchMatch = filterState.searchQuery === '' ||
        subject.name.toLowerCase().includes(searchLower) ||
        subject.topics.some(t => t.name.toLowerCase().includes(searchLower));
      
      return levelMatch && searchMatch;
    });
  }, [rawSubjects, filterState.selectedLevelIds, filterState.searchQuery]);

  // Update filter state helpers
  const toggleSystemFilter = (systemId: string) => {
    setFilterState(prev => {
      const isSelected = prev.selectedSystemIds.includes(systemId);
      const newSystemIds = isSelected
        ? prev.selectedSystemIds.filter(id => id !== systemId)
        : [...prev.selectedSystemIds, systemId];
      
      // When a system is deselected, also deselect its levels
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

  return {
    systems,
    availableLevels,
    filteredSubjects,
    rawSubjects,
    setRawSubjects,
    loading,
    error,
    filterState,
    setFilterState,
    toggleSystemFilter,
    toggleLevelFilter,
    setSearchQuery,
    clearFilters
  };
};
