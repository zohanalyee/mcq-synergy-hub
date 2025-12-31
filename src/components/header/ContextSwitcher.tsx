import { useState, useEffect } from 'react';
import { ChevronDown, GraduationCap, Briefcase, Target, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLearning } from '@/contexts/LearningContext';
import { useAuth } from '@/contexts/AuthContext';
import { getLevelsBySystem } from '@/services/lmsStructureService';
import { Level } from '@/types/lms.types';

const ContextSwitcher = () => {
  const { user } = useAuth();
  const { 
    systems, 
    activeSystem, 
    activeLevel, 
    activeContext,
    setActiveContext 
  } = useLearning();
  
  const [systemLevels, setSystemLevels] = useState<Record<string, Level[]>>({});
  const [loadingLevels, setLoadingLevels] = useState<string | null>(null);

  // Preload levels for hovered system
  const handleSystemHover = async (systemId: string) => {
    if (systemLevels[systemId]) return;
    
    setLoadingLevels(systemId);
    try {
      const levels = await getLevelsBySystem(systemId);
      setSystemLevels(prev => ({ ...prev, [systemId]: levels }));
    } catch (error) {
      console.error('Error loading levels:', error);
    } finally {
      setLoadingLevels(null);
    }
  };

  const handleSelectLevel = async (systemId: string, levelId: string) => {
    await setActiveContext({ system_id: systemId, level_id: levelId });
  };

  // Don't show if user is not logged in
  if (!user) return null;

  const getSystemIcon = (type: 'academic' | 'job') => {
    return type === 'academic' ? (
      <GraduationCap className="h-4 w-4" />
    ) : (
      <Briefcase className="h-4 w-4" />
    );
  };

  const displayText = activeSystem && activeLevel
    ? `${activeSystem.name} • ${activeLevel.name}`
    : 'Select your Goal';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-1.5 px-2.5 text-xs font-medium bg-background/50 backdrop-blur-sm border-border/50 hover:bg-accent/50"
        >
          <Target className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline max-w-[140px] truncate">{displayText}</span>
          <span className="sm:hidden">Goal</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-56 bg-popover/95 backdrop-blur-xl border-border/50"
      >
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Select Learning Goal
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {systems.length === 0 ? (
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            No systems available
          </DropdownMenuItem>
        ) : (
          systems.map((system) => (
            <DropdownMenuSub key={system.id}>
              <DropdownMenuSubTrigger 
                className="text-sm gap-2"
                onMouseEnter={() => handleSystemHover(system.id)}
                onFocus={() => handleSystemHover(system.id)}
              >
                {getSystemIcon(system.type)}
                <span className="flex-1">{system.name}</span>
                {activeContext?.system_id === system.id && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                {loadingLevels === system.id ? (
                  <DropdownMenuItem disabled className="text-xs">
                    Loading...
                  </DropdownMenuItem>
                ) : systemLevels[system.id]?.length === 0 ? (
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                    No levels available
                  </DropdownMenuItem>
                ) : (
                  systemLevels[system.id]?.map((level) => (
                    <DropdownMenuItem
                      key={level.id}
                      className="text-sm gap-2 cursor-pointer"
                      onClick={() => handleSelectLevel(system.id, level.id)}
                    >
                      <span className="flex-1">{level.name}</span>
                      {activeContext?.level_id === level.id && (
                        <Check className="h-3.5 w-3.5 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ContextSwitcher;
