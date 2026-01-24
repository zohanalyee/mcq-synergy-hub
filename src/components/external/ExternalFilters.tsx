import { motion } from "framer-motion";
import { Filter, Building2, MapPin, Globe } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { SectorType, RegionType, ScholarshipScope, ExternalOpportunityFilters } from "@/types/externalOpportunities";

interface ExternalFiltersProps {
  filters: ExternalOpportunityFilters;
  onFiltersChange: (filters: ExternalOpportunityFilters) => void;
  type: 'job' | 'scholarship';
}

const REGIONS: { value: RegionType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Regions' },
  { value: 'sindh', label: 'Sindh' },
  { value: 'punjab', label: 'Punjab' },
  { value: 'kpk', label: 'KPK' },
  { value: 'balochistan', label: 'Balochistan' },
  { value: 'federal', label: 'Federal (Islamabad)' },
  { value: 'international', label: 'International' },
  { value: 'other', label: 'Other / Remote' },
];

const ExternalFilters = ({ filters, onFiltersChange, type }: ExternalFiltersProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleSectorChange = (value: string) => {
    onFiltersChange({ ...filters, sector: value as SectorType | 'all' });
  };

  const handleRegionChange = (value: string) => {
    onFiltersChange({ ...filters, region: value as RegionType | 'all' });
  };

  const handleScopeChange = (value: string) => {
    onFiltersChange({ ...filters, scholarship_scope: value as ScholarshipScope | 'all' });
  };

  const clearFilters = () => {
    onFiltersChange({ sector: 'all', region: 'all', scholarship_scope: 'all' });
  };

  const hasActiveFilters = 
    (filters.sector && filters.sector !== 'all') || 
    (filters.region && filters.region !== 'all') ||
    (filters.scholarship_scope && filters.scholarship_scope !== 'all');

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="sticky top-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="pb-3">
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">Active</Badge>
                )}
              </CardTitle>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Sector Filter (Jobs only) */}
              {type === 'job' && (
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Building2 className="h-4 w-4" />
                    Sector
                  </Label>
                  <RadioGroup value={filters.sector || 'all'} onValueChange={handleSectorChange}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="sector-all" />
                      <Label htmlFor="sector-all" className="text-sm font-normal cursor-pointer">All</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="government" id="sector-govt" />
                      <Label htmlFor="sector-govt" className="text-sm font-normal cursor-pointer">Government</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="private" id="sector-private" />
                      <Label htmlFor="sector-private" className="text-sm font-normal cursor-pointer">Private</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Scholarship Scope Filter (Scholarships only) */}
              {type === 'scholarship' && (
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Globe className="h-4 w-4" />
                    Scope
                  </Label>
                  <RadioGroup value={filters.scholarship_scope || 'all'} onValueChange={handleScopeChange}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="scope-all" />
                      <Label htmlFor="scope-all" className="text-sm font-normal cursor-pointer">All</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="national" id="scope-national" />
                      <Label htmlFor="scope-national" className="text-sm font-normal cursor-pointer">National</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="international" id="scope-international" />
                      <Label htmlFor="scope-international" className="text-sm font-normal cursor-pointer">International</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Region Filter */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4" />
                  Region
                </Label>
                <RadioGroup value={filters.region || 'all'} onValueChange={handleRegionChange}>
                  {REGIONS.map((region) => (
                    <div key={region.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={region.value} id={`region-${region.value}`} />
                      <Label htmlFor={`region-${region.value}`} className="text-sm font-normal cursor-pointer">
                        {region.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  );
};

export default ExternalFilters;
