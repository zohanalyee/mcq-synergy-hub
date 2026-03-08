import { useState, useMemo } from "react";
import { Search, X, Filter, Building2, Clock, Check, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { JobTest } from "@/data/jobTestsData";
import { motion, AnimatePresence } from "framer-motion";

export interface ExamFilters {
  organization: string;
  duration: string; // 'all' | 'short' | 'medium' | 'long'
}

interface ExamFiltersBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: ExamFilters;
  onFiltersChange: (filters: ExamFilters) => void;
  jobTests: JobTest[];
}

const DURATION_OPTIONS: { value: string; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: '⏱️' },
  { value: 'short', label: '≤ 90 min', icon: '⚡' },
  { value: 'medium', label: '91–120 min', icon: '⏳' },
  { value: 'long', label: '120+ min', icon: '🕐' },
];

const ExamFiltersBar = ({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  jobTests,
}: ExamFiltersBarProps) => {
  const [filterOpen, setFilterOpen] = useState(false);

  // Derive unique organizations from available data
  const organizations = useMemo(() => {
    const orgs = Array.from(new Set(jobTests.map((t) => t.organization))).sort();
    return [{ value: 'all', label: 'All Organizations' }, ...orgs.map((o) => ({ value: o, label: o }))];
  }, [jobTests]);

  const hasActiveFilters =
    (filters.organization && filters.organization !== 'all') ||
    (filters.duration && filters.duration !== 'all');

  const activeFilterCount = [
    filters.organization !== 'all' ? 1 : 0,
    filters.duration !== 'all' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearFilters = () => onFiltersChange({ organization: 'all', duration: 'all' });
  const clearSingle = (key: keyof ExamFilters) => onFiltersChange({ ...filters, [key]: 'all' });

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {/* Search + Filter Row */}
      <div className="flex items-center gap-3">
        {/* Glass Capsule Search */}
        <div className="flex-1 relative group">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-0 group-focus-within:opacity-100 blur-md transition-opacity duration-300" />
          <div
            className={cn(
              "relative flex items-center rounded-full",
              "bg-white/80 dark:bg-slate-900/80",
              "backdrop-blur-md",
              "border border-white/50 dark:border-white/20",
              "shadow-sm hover:shadow-md transition-all duration-300",
              "focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary/30"
            )}
          >
            <Search className="absolute left-4 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              placeholder="Search exams, organizations, or job positions..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={cn(
                "w-full h-11 pl-11 pr-10 rounded-full",
                "bg-transparent",
                "text-sm placeholder:text-muted-foreground",
                "focus:outline-none",
                "transition-all duration-200"
              )}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-4 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Button */}
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "relative h-11 w-11 rounded-2xl",
                "bg-gradient-to-br from-primary to-primary/80",
                "text-white",
                "shadow-md hover:shadow-lg",
                "hover:scale-105 active:scale-95",
                "transition-all duration-200"
              )}
            >
              <Filter className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-[10px] font-bold flex items-center justify-center text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            sideOffset={8}
            className={cn(
              "w-80 p-0 rounded-3xl",
              "bg-white/95 dark:bg-slate-900/95",
              "backdrop-blur-xl",
              "border border-white/50 dark:border-white/20",
              "shadow-2xl"
            )}
          >
            <div className="p-4 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center",
                    "bg-gradient-to-br from-primary to-primary/80",
                    "shadow-md"
                  )}>
                    <Filter className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm">Filters</h3>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive rounded-full"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>

              {/* Organization */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Building2 className="h-3.5 w-3.5" />
                  Organization
                </div>
                <div className="flex flex-wrap gap-2">
                  {organizations.map((org) => {
                    const isSelected = filters.organization === org.value;
                    return (
                      <button
                        key={org.value}
                        onClick={() => onFiltersChange({ ...filters, organization: org.value })}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium",
                          "transition-all duration-200 border",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-md"
                            : "bg-muted/30 text-muted-foreground border-muted-foreground/20 hover:bg-muted/50 hover:border-muted-foreground/30"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        {org.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Clock className="h-3.5 w-3.5" />
                  Duration
                </div>
                <div className="flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((opt) => {
                    const isSelected = filters.duration === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => onFiltersChange({ ...filters, duration: opt.value })}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium",
                          "transition-all duration-200 border",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-md"
                            : "bg-muted/30 text-muted-foreground border-muted-foreground/20 hover:bg-muted/50 hover:border-muted-foreground/30"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        <span>{opt.icon}</span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filter Chips */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-center gap-2"
          >
            <span className="text-xs text-muted-foreground">Active:</span>

            {filters.organization !== 'all' && (
              <Badge
                variant="secondary"
                className={cn(
                  "pl-2 pr-1 py-1 gap-1 rounded-full",
                  "bg-primary/10 text-primary border border-primary/20",
                  "hover:bg-primary/20 transition-colors"
                )}
              >
                <Building2 className="h-3 w-3" />
                {filters.organization}
                <button onClick={() => clearSingle('organization')} className="ml-1 p-0.5 rounded-full hover:bg-primary/20">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filters.duration !== 'all' && (
              <Badge
                variant="secondary"
                className={cn(
                  "pl-2 pr-1 py-1 gap-1 rounded-full",
                  "bg-primary/10 text-primary border border-primary/20",
                  "hover:bg-primary/20 transition-colors"
                )}
              >
                <Clock className="h-3 w-3" />
                {DURATION_OPTIONS.find((d) => d.value === filters.duration)?.label}
                <button onClick={() => clearSingle('duration')} className="ml-1 p-0.5 rounded-full hover:bg-primary/20">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive"
            >
              Clear all
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search feedback */}
      <AnimatePresence>
        {searchQuery && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Searching: "<span className="text-primary font-medium">{searchQuery}</span>"</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExamFiltersBar;
