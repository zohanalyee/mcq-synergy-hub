import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, GraduationCap, Briefcase, X, Bookmark, Trash2, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EducationalSystemWithLevels, FilterState, SavedSyllabusTemplate } from './interfaces';

interface FilterSidebarProps {
  systems: EducationalSystemWithLevels[];
  availableLevels: { id: string; name: string; systemName: string; systemId: string }[];
  filterState: FilterState;
  toggleSystemFilter: (systemId: string) => void;
  toggleLevelFilter: (levelId: string) => void;
  clearFilters: () => void;
  templates?: SavedSyllabusTemplate[];
  loadingTemplates?: boolean;
  onLoadTemplate?: (template: SavedSyllabusTemplate) => void;
  onDeleteTemplate?: (templateId: string) => void;
  isAuthenticated?: boolean;
}

export const FilterSidebar = ({
  systems,
  availableLevels,
  filterState,
  toggleSystemFilter,
  toggleLevelFilter,
  clearFilters,
  templates = [],
  loadingTemplates = false,
  onLoadTemplate,
  onDeleteTemplate,
  isAuthenticated = false
}: FilterSidebarProps) => {
  const [systemsOpen, setSystemsOpen] = useState(true);
  const [levelsOpen, setLevelsOpen] = useState(true);
  const [templatesOpen, setTemplatesOpen] = useState(true);

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
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors">
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
        <CollapsibleContent className="space-y-2 pt-2">
          {systems.map(system => (
            <label
              key={system.id}
              className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={filterState.selectedSystemIds.includes(system.id)}
                onCheckedChange={() => toggleSystemFilter(system.id)}
              />
              <span className="flex items-center gap-2 text-sm">
                {getSystemIcon(system.type)}
                {system.name}
              </span>
              <Badge variant="outline" className="ml-auto h-5 px-1.5 text-xs">
                {system.levels.length}
              </Badge>
            </label>
          ))}
          {systems.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">No systems available</p>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Levels Section */}
      <Collapsible open={levelsOpen} onOpenChange={setLevelsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors">
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
        <CollapsibleContent className="space-y-2 pt-2">
          {availableLevels.map(level => (
            <label
              key={level.id}
              className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={filterState.selectedLevelIds.includes(level.id)}
                onCheckedChange={() => toggleLevelFilter(level.id)}
              />
              <span className="text-sm">{level.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">{level.systemName}</span>
            </label>
          ))}
          {availableLevels.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">
              {filterState.selectedSystemIds.length > 0 
                ? 'No levels in selected systems' 
                : 'No levels available'}
            </p>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Saved Templates Section */}
      <Collapsible open={templatesOpen} onOpenChange={setTemplatesOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors">
          <span className="flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            My Saved Templates
            {templates.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {templates.length}
              </Badge>
            )}
          </span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", templatesOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          {!isAuthenticated ? (
            <div className="text-center py-4 space-y-2">
              <LogIn className="h-5 w-5 mx-auto text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Sign in to save and load templates
              </p>
            </div>
          ) : loadingTemplates ? (
            <div className="py-2 text-xs text-muted-foreground text-center">
              Loading templates...
            </div>
          ) : templates.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 text-center">
              No saved templates yet. Create one by selecting topics and clicking "Save Template".
            </p>
          ) : (
            templates.map(template => (
              <div
                key={template.id}
                className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{template.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {template.selected_topic_ids.length} topics • {template.quiz_settings.questionsCount}Q
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onLoadTemplate?.(template)}
                    className="h-7 px-2 text-xs"
                  >
                    Load
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteTemplate?.(template.id)}
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
