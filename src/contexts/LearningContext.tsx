import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { EducationalSystem, Level, ActiveLearningContext } from '@/types/lms.types';
import { getEducationalSystems, getLevelsBySystem } from '@/services/lmsStructureService';

interface LearningContextType {
  systems: EducationalSystem[];
  levels: Level[];
  activeContext: ActiveLearningContext | null;
  activeSystem: EducationalSystem | null;
  activeLevel: Level | null;
  loading: boolean;
  setActiveContext: (context: ActiveLearningContext) => Promise<void>;
  clearContext: () => Promise<void>;
  refreshSystems: () => Promise<void>;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export const useLearning = () => {
  const context = useContext(LearningContext);
  if (context === undefined) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
};

interface LearningProviderProps {
  children: ReactNode;
}

export const LearningProvider: React.FC<LearningProviderProps> = ({ children }) => {
  const { user, profile } = useAuth();
  const [systems, setSystems] = useState<EducationalSystem[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [activeContext, setActiveContextState] = useState<ActiveLearningContext | null>(null);
  const [activeSystem, setActiveSystem] = useState<EducationalSystem | null>(null);
  const [activeLevel, setActiveLevel] = useState<Level | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all systems on mount
  const refreshSystems = async () => {
    try {
      const systemsData = await getEducationalSystems();
      setSystems(systemsData.filter(s => s.is_active));
    } catch (error) {
      console.error('Error fetching systems:', error);
    }
  };

  useEffect(() => {
    refreshSystems();
  }, []);

  // Load levels when active system changes
  useEffect(() => {
    const loadLevels = async () => {
      if (activeContext?.system_id) {
        const levelsData = await getLevelsBySystem(activeContext.system_id);
        setLevels(levelsData);
        
        // Find active system
        const system = systems.find(s => s.id === activeContext.system_id);
        setActiveSystem(system || null);
        
        // Find active level
        if (activeContext.level_id) {
          const level = levelsData.find(l => l.id === activeContext.level_id);
          setActiveLevel(level || null);
        }
      } else {
        setLevels([]);
        setActiveSystem(null);
        setActiveLevel(null);
      }
    };

    loadLevels();
  }, [activeContext?.system_id, activeContext?.level_id, systems]);

  // Load context from profile when user logs in
  useEffect(() => {
    if (profile?.active_learning_context) {
      const ctx = profile.active_learning_context as ActiveLearningContext;
      if (ctx.system_id || ctx.level_id) {
        setActiveContextState(ctx);
      }
    }
    setLoading(false);
  }, [profile]);

  // Update context in database and local state
  const setActiveContext = async (context: ActiveLearningContext) => {
    setActiveContextState(context);
    
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ active_learning_context: context as any })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error updating learning context:', error);
      }
    }
  };

  const clearContext = async () => {
    setActiveContextState(null);
    setActiveSystem(null);
    setActiveLevel(null);
    
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ active_learning_context: {} })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error clearing learning context:', error);
      }
    }
  };

  const value = {
    systems,
    levels,
    activeContext,
    activeSystem,
    activeLevel,
    loading,
    setActiveContext,
    clearContext,
    refreshSystems,
  };

  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>;
};
