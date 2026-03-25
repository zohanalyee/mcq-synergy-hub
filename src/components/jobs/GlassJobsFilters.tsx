import { useState } from "react";
import { Search, Filter, X, Building2, MapPin, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SectorType, RegionType, ExternalOpportunityFilters } from "@/types/externalOpportunities";

interface GlassJobsFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: ExternalOpportunityFilters;
  onFiltersChange: (filters: ExternalOpportunityFilters) => void;
}

const SECTORS: { value: SectorType | 'all'; label: string; icon?: string }[] = [
  { value: 'all', label: 'All Sectors' },
  { value: 'government', label: 'Government', icon: '🏛️' },
  { value: 'private', label: 'Private', icon: '🏢' },
];

const REGIONS: { value: RegionType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Regions' },
  { value: 'sindh', label: 'Sindh' },
  { value: 'punjab', label: 'Punjab' },
  { value: 'kpk', label: 'KPK' },
  { value: 'balochistan', label: 'Balochistan' },
  { value: 'federal', label: 'Federal' },
  { value: 'international', label: 'International' },
  { value: 'other', label: 'Remote / Other' },
];

const GlassJobsFilters = ({ 
  searchQuery, 
  onSearchChange,
  filters,
  onFiltersChange 
}: GlassJobsFiltersProps) => {
  const { isAdmin } = useUserRole();
  const [filterOpen, setFilterOpen] = useState(false);

  const hasActiveFilters = 
    (filters.sector && filters.sector !== 'all') || 
    (filters.region && filters.region !== 'all');

  const activeFilterCount = [
    filters.sector !== 'all' ? 1 : 0,
    filters.region !== 'all' ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  const handleSectorChange = (value: SectorType | 'all') => {
    onFiltersChange({ ...filters, sector: value });
  };

  const handleRegionChange = (value: RegionType | 'all') => {
    onFiltersChange({ ...filters, region: value });
  };

  const clearFilters = () => {
    onFiltersChange({ sector: 'all', region: 'all' });
  };

  const clearSingleFilter = (type: 'sector' | 'region') => {
    onFiltersChange({ ...filters, [type]: 'all' });
  };

  return (
    <div className="space-y-3">
      {/* Search Bar + Filter Button Row */}
      <div className="flex items-center gap-3">
        {/* Glass Capsule Search Bar */}
        <div className="flex-1 relative group">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-0 group-focus-within:opacity-100 blur-md transition-opacity duration-300" />
          <div className={cn(
            "relative flex items-center rounded-full",
            "bg-white/80 dark:bg-slate-900/80",
            "backdrop-blur-md",
            "border border-white/50 dark:border-white/20",
            "shadow-sm hover:shadow-md transition-all duration-300",
            "focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary/30"
          )}>
            <Search className="absolute left-4 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              placeholder="Search jobs by title, organization..."
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

        {/* Filter Button (Squircle) */}
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

          {/* Glass Filter Popover */}
          <PopoverContent
            align="end"
            sideOffset={8}
            className={cn(
              "w-80 p-0",
              "rounded-3xl",
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

              {/* Sector Selection */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Building2 className="h-3.5 w-3.5" />
                  Sector
                </div>
                <div className="flex flex-wrap gap-2">
                  {SECTORS.map((sector) => {
                    const isSelected = filters.sector === sector.value;
                    return (
                      <button
                        key={sector.value}
                        onClick={() => handleSectorChange(sector.value)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium",
                          "transition-all duration-200",
                          "border",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-md"
                            : "bg-muted/30 text-muted-foreground border-muted-foreground/20 hover:bg-muted/50 hover:border-muted-foreground/30"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        {sector.icon && <span>{sector.icon}</span>}
                        {sector.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Region Selection */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <MapPin className="h-3.5 w-3.5" />
                  Region
                </div>
                <div className="flex flex-wrap gap-2">
                  {REGIONS.map((region) => {
                    const isSelected = filters.region === region.value;
                    return (
                      <button
                        key={region.value}
                        onClick={() => handleRegionChange(region.value)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium",
                          "transition-all duration-200",
                          "border",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-md"
                            : "bg-muted/30 text-muted-foreground border-muted-foreground/20 hover:bg-muted/50 hover:border-muted-foreground/30"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        {region.label}
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
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          
          {filters.sector && filters.sector !== 'all' && (
            <Badge
              variant="secondary"
              className={cn(
                "pl-2 pr-1 py-1 gap-1 rounded-full",
                "bg-primary/10 text-primary border border-primary/20",
                "hover:bg-primary/20 transition-colors"
              )}
            >
              <Building2 className="h-3 w-3" />
              {SECTORS.find(s => s.value === filters.sector)?.label}
              <button
                onClick={() => clearSingleFilter('sector')}
                className="ml-1 p-0.5 rounded-full hover:bg-primary/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.region && filters.region !== 'all' && (
            <Badge
              variant="secondary"
              className={cn(
                "pl-2 pr-1 py-1 gap-1 rounded-full",
                "bg-primary/10 text-primary border border-primary/20",
                "hover:bg-primary/20 transition-colors"
              )}
            >
              <MapPin className="h-3 w-3" />
              {REGIONS.find(r => r.value === filters.region)?.label}
              <button
                onClick={() => clearSingleFilter('region')}
                className="ml-1 p-0.5 rounded-full hover:bg-primary/20"
              >
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
        </div>
      )}
    </div>
  );
};

export default GlassJobsFilters;
