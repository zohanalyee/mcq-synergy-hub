import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, GraduationCap, Briefcase, X, Filter, Check, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EducationalSystemWithLevels, FilterState } from './interfaces';

interface GlassFilterSidebarProps {
  systems: EducationalSystemWithLevels[];
  availableLevels: { id: string; name: string; systemName: string; systemId: string }[];
  filterState: FilterState;
  toggleSystemFilter: (systemId: string) => void;
  toggleLevelFilter: (levelId: string) => void;
  clearFilters: () => void;
}

export const GlassFilterSidebar = ({
  systems,
  availableLevels,
  filterState,
  toggleSystemFilter,
  toggleLevelFilter,
  clearFilters
}: GlassFilterSidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [systemsOpen, setSystemsOpen] = useState(true);
  const [levelsOpen, setLevelsOpen] = useState(true);

  const hasActiveFilters = filterState.selectedSystemIds.length > 0 || filterState.selectedLevelIds.length > 0;
  const totalFilters = filterState.selectedSystemIds.length + filterState.selectedLevelIds.length;

  const getSystemIcon = (type: string) => {
    return type === 'job' ? <Briefcase className="h-3.5 w-3.5" /> : <GraduationCap className="h-3.5 w-3.5" />;
  };

  return (
    <div className="relative">
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {/* Compact Filter Toggle Button */}
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2.5 rounded-full",
            "bg-white/80 dark:bg-slate-900/80",
            "backdrop-blur-md",
            "border border-white/50 dark:border-white/20",
            "shadow-sm hover:shadow-md",
            "transition-all duration-300",
            "text-sm font-medium",
            isOpen && "ring-2 ring-primary/50 border-primary/30",
            hasActiveFilters && "border-primary/40"
          )}
        >
          <SlidersHorizontal className={cn("h-4 w-4", hasActiveFilters ? "text-primary" : "text-muted-foreground")} />
          <span>Filters</span>
          {totalFilters > 0 && (
            <span className={cn(
              "h-5 min-w-5 px-1.5 rounded-full text-[10px] font-bold",
              "bg-primary text-primary-foreground",
              "flex items-center justify-center"
            )}>
              {totalFilters}
            </span>
          )}
          <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
        </button>
      </CollapsibleTrigger>

      {/* Expandable Filter Panel */}
      <CollapsibleContent>
        <div className={cn(
          "mt-3 rounded-3xl p-4",
          "bg-white/80 dark:bg-slate-900/80",
          "backdrop-blur-md",
          "border border-white/50 dark:border-white/20",
          "shadow-lg"
        )}>
          {/* Header with Clear */}
          {hasActiveFilters && (
            <div className="flex items-center justify-end mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive rounded-full"
              >
                <X className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            </div>
          )}

          {/* Educational Systems Section */}
          <Collapsible open={systemsOpen} onOpenChange={setSystemsOpen}>
            <CollapsibleTrigger className={cn(
              "flex items-center justify-between w-full py-2.5 px-3 text-sm font-semibold",
              "rounded-2xl",
              "hover:bg-muted/50",
              "transition-all duration-200"
            )}>
              <span className="flex items-center gap-2">
                Educational Systems
                {filterState.selectedSystemIds.length > 0 && (
                  <span className={cn(
                    "h-5 min-w-5 px-1.5 rounded-full text-[10px] font-bold",
                    "bg-primary text-primary-foreground",
                    "flex items-center justify-center"
                  )}>
                    {filterState.selectedSystemIds.length}
                  </span>
                )}
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", systemsOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto scrollbar-thin p-1">
                {systems.map(system => {
                  const isSelected = filterState.selectedSystemIds.includes(system.id);
                  return (
                    <button
                      key={system.id}
                      onClick={() => toggleSystemFilter(system.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                        "transition-all duration-200",
                        "border",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-md"
                          : "bg-muted/30 text-muted-foreground border-muted-foreground/20 hover:bg-muted/50 hover:border-muted-foreground/30"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      {getSystemIcon(system.type)}
                      <span className="truncate max-w-[120px]">{system.name}</span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full",
                        isSelected ? "bg-white/20" : "bg-muted"
                      )}>
                        {system.levels.length}
                      </span>
                    </button>
                  );
                })}
              </div>
              {systems.length === 0 && (
                <p className="text-xs text-muted-foreground py-2 text-center">No systems available</p>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Divider */}
          <div className="my-3 border-t border-border/30" />

          {/* Levels Section */}
          <Collapsible open={levelsOpen} onOpenChange={setLevelsOpen}>
            <CollapsibleTrigger className={cn(
              "flex items-center justify-between w-full py-2.5 px-3 text-sm font-semibold",
              "rounded-2xl",
              "hover:bg-muted/50",
              "transition-all duration-200"
            )}>
              <span className="flex items-center gap-2">
                Levels / Classes
                {filterState.selectedLevelIds.length > 0 && (
                  <span className={cn(
                    "h-5 min-w-5 px-1.5 rounded-full text-[10px] font-bold",
                    "bg-primary text-primary-foreground",
                    "flex items-center justify-center"
                  )}>
                    {filterState.selectedLevelIds.length}
                  </span>
                )}
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", levelsOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto scrollbar-thin p-1">
                {availableLevels.map(level => {
                  const isSelected = filterState.selectedLevelIds.includes(level.id);
                  return (
                    <button
                      key={level.id}
                      onClick={() => toggleLevelFilter(level.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                        "transition-all duration-200",
                        "border",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-md"
                          : "bg-muted/30 text-muted-foreground border-muted-foreground/20 hover:bg-muted/50 hover:border-muted-foreground/30"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      <span>{level.name}</span>
                    </button>
                  );
                })}
              </div>
              {availableLevels.length === 0 && (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  {filterState.selectedSystemIds.length > 0 
                    ? 'No levels in selected systems' 
                    : 'No levels available'}
                </p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
