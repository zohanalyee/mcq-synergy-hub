import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, GraduationCap, Briefcase, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EducationalSystemWithLevels, FilterState } from './interfaces';

interface FilterSidebarProps {
  systems: EducationalSystemWithLevels[];
  availableLevels: { id: string; name: string; systemName: string; systemId: string }[];
  filterState: FilterState;
  toggleSystemFilter: (systemId: string) => void;
  toggleLevelFilter: (levelId: string) => void;
  clearFilters: () => void;
}

export const FilterSidebar = ({
  systems,
  availableLevels,
  filterState,
  toggleSystemFilter,
  toggleLevelFilter,
  clearFilters
}: FilterSidebarProps) => {
  const [systemsOpen, setSystemsOpen] = useState(false);
  const [levelsOpen, setLevelsOpen] = useState(false);

  const hasActiveFilters = filterState.selectedSystemIds.length > 0 || filterState.selectedLevelIds.length > 0;

  const getSystemIcon = (type: string) => {
    return type === 'job' ? <Briefcase className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Header with clear button */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Educational Systems Section */}
      <Collapsible open={systemsOpen} onOpenChange={setSystemsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2.5 px-2 text-sm font-semibold rounded-md hover:bg-muted/50 hover:text-primary transition-all duration-200">
          <span className="flex items-center gap-2">
            Educational Systems
            {filterState.selectedSystemIds.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {filterState.selectedSystemIds.length}
              </Badge>
            )}
          </span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", systemsOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="max-h-[250px] overflow-y-auto scrollbar-thin space-y-0.5 pr-1">
            {systems.map(system => (
              <label
                key={system.id}
                className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors text-sm"
              >
                <Checkbox
                  checked={filterState.selectedSystemIds.includes(system.id)}
                  onCheckedChange={() => toggleSystemFilter(system.id)}
                />
                <span className="flex items-center gap-2">
                  {getSystemIcon(system.type)}
                  {system.name}
                </span>
                <Badge variant="outline" className="ml-auto h-5 px-1.5 text-xs">
                  {system.levels.length}
                </Badge>
              </label>
            ))}
          </div>
          {systems.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">No systems available</p>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Divider between sections */}
      <div className="border-t border-border/50 my-2" />

      {/* Levels Section */}
      <Collapsible open={levelsOpen} onOpenChange={setLevelsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2.5 px-2 text-sm font-semibold rounded-md hover:bg-muted/50 hover:text-primary transition-all duration-200">
          <span className="flex items-center gap-2">
            Levels / Classes
            {filterState.selectedLevelIds.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {filterState.selectedLevelIds.length}
              </Badge>
            )}
          </span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", levelsOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="max-h-[250px] overflow-y-auto scrollbar-thin space-y-0.5 pr-1">
            {availableLevels.map(level => (
              <label
                key={level.id}
                className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors text-sm"
              >
                <Checkbox
                  checked={filterState.selectedLevelIds.includes(level.id)}
                  onCheckedChange={() => toggleLevelFilter(level.id)}
                />
                <span>{level.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">{level.systemName}</span>
              </label>
            ))}
          </div>
          {availableLevels.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">
              {filterState.selectedSystemIds.length > 0 
                ? 'No levels in selected systems' 
                : 'No levels available'}
            </p>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
