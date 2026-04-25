import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Eye, Calendar, Building2, MapPin, Briefcase, GraduationCap, Globe, Building } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalOpportunity, OpportunityType } from "@/types/externalOpportunities";
import { generateSlugUrl } from "@/utils/slugify";

interface ExternalOpportunitiesSectionProps {
  opportunities: ExternalOpportunity[];
  isLoading: boolean;
  type: OpportunityType;
}

const ExternalOpportunitiesSection = ({ opportunities, isLoading, type }: ExternalOpportunitiesSectionProps) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No deadline";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const TypeIcon = type === "job" ? Briefcase : GraduationCap;
  const title = type === "job" ? "External Jobs" : "External Scholarships";
  const description = type === "job" 
    ? "Curated job opportunities from LinkedIn, Indeed, and more"
    : "Curated scholarships from HEC, Fulbright, and more";

  const getSectorBadge = (sector: string | null) => {
    if (!sector) return null;
    return (
      <Badge 
        variant={sector === 'government' ? 'default' : 'secondary'} 
        className="text-xs gap-1"
      >
        <Building className="h-3 w-3" />
        {sector === 'government' ? 'Govt' : 'Private'}
      </Badge>
    );
  };

  const getRegionBadge = (region: string | null) => {
    if (!region || region === 'other') return null;
    const regionLabels: Record<string, string> = {
      sindh: 'Sindh',
      punjab: 'Punjab',
      kpk: 'KPK',
      balochistan: 'Balochistan',
      federal: 'Federal',
      international: 'International'
    };
    return (
      <Badge variant="outline" className="text-xs gap-1">
        <MapPin className="h-3 w-3" />
        {regionLabels[region] || region}
      </Badge>
    );
  };

  const getScopeBadge = (scope: string | null) => {
    if (!scope) return null;
    return (
      <Badge 
        variant={scope === 'international' ? 'default' : 'secondary'} 
        className="text-xs gap-1"
      >
        <Globe className="h-3 w-3" />
        {scope === 'international' ? 'International' : 'National'}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <TypeIcon className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    );
  }

  if (opportunities.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="mt-8"
    >
      <div className="flex items-center gap-2 mb-2">
        <TypeIcon className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">{title}</h2>
        <Badge variant="secondary" className="ml-2">{opportunities.length}</Badge>
      </div>
      <p className="text-muted-foreground text-sm mb-4">{description}</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {opportunities.map((opp, index) => (
          <motion.div
            key={opp.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow group">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <img
                    src={opp.image_url || '/placeholder.svg'}
                    alt={opp.title}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-muted"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {opp.source_name}
                      </Badge>
                      {type === 'job' && getSectorBadge(opp.sector)}
                      {type === 'scholarship' && getScopeBadge(opp.scholarship_scope)}
                    </div>
                    <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
                      {opp.title}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="line-clamp-2 mb-3 text-xs">
                  {opp.description || "No description available"}
                </CardDescription>

                <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                  {opp.organization && (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3 w-3" />
                      <span className="truncate">{opp.organization}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    <span>{opp.location || 'Location not specified'}</span>
                    {getRegionBadge(opp.region)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    <span>Deadline: {formatDate(opp.deadline_date)}</span>
                  </div>
                </div>

                {(opp as any).status === 'pending' && (
                  <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30 mb-2">
                    Pending Review
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-1"
                  asChild
                >
                  <Link to={`/opportunity/${generateSlugUrl(opp.title, opp.id)}`}>
                    <Eye className="h-3 w-3" />
                    View Details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ExternalOpportunitiesSection;
