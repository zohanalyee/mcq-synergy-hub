import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Eye, Calendar, Building2, MapPin, Briefcase, GraduationCap, Globe, Building, Clock, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalOpportunity, OpportunityType } from "@/types/externalOpportunities";
import { generateSlugUrl } from "@/utils/slugify";
import { cn } from "@/lib/utils";

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

  // Urgency: deadline within 7 days = pulsing red; <=30 days = red; else muted
  const getDeadlineUrgency = (dateString: string | null) => {
    if (!dateString) return { color: "text-muted-foreground", pulse: false, hasDeadline: false };
    const days = Math.ceil((new Date(dateString).getTime() - Date.now()) / 86400000);
    if (days < 0) return { color: "text-muted-foreground line-through", pulse: false, hasDeadline: true };
    if (days <= 7) return { color: "text-red-600 dark:text-red-400 font-bold", pulse: true, hasDeadline: true };
    if (days <= 30) return { color: "text-red-600 dark:text-red-400 font-semibold", pulse: false, hasDeadline: true };
    return { color: "text-foreground font-medium", pulse: false, hasDeadline: true };
  };

  const TypeIcon = type === "job" ? Briefcase : GraduationCap;
  const title = type === "job" ? "External Jobs" : "External Scholarships";
  const description = type === "job"
    ? "Curated job opportunities from LinkedIn, Indeed, and more"
    : "Curated scholarships from HEC, Fulbright, and more";

  const getSectorBadge = (sector: string | null) => {
    if (!sector) return null;
    const isGovt = sector === "government";
    return (
      <Badge
        className={cn(
          "text-[10px] gap-1 border-0 font-semibold",
          isGovt
            ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 hover:bg-green-200"
            : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 hover:bg-indigo-200"
        )}
      >
        <Building className="h-3 w-3" />
        {isGovt ? "Govt" : "Private"}
      </Badge>
    );
  };

  const getRegionBadge = (region: string | null) => {
    if (!region || region === "other") return null;
    const regionLabels: Record<string, string> = {
      sindh: "Sindh", punjab: "Punjab", kpk: "KPK",
      balochistan: "Balochistan", federal: "Federal", international: "International"
    };
    const isIntl = region === "international";
    return (
      <Badge
        className={cn(
          "text-[10px] gap-1 border-0 font-semibold",
          isIntl
            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
            : "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
        )}
      >
        <MapPin className="h-3 w-3" />
        {regionLabels[region] || region}
      </Badge>
    );
  };

  const getScopeBadge = (scope: string | null) => {
    if (!scope) return null;
    const isIntl = scope === "international";
    return (
      <Badge
        className={cn(
          "text-[10px] gap-1 border-0 font-semibold",
          isIntl
            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
            : "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
        )}
      >
        <Globe className="h-3 w-3" />
        {isIntl ? "International" : "National"}
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full">
        {opportunities.map((opp, index) => {
          const urgency = getDeadlineUrgency(opp.deadline_date);
          return (
            <motion.div
              key={opp.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
              className="min-w-0 w-full"
            >
              <Card
                className={cn(
                  "h-full w-full max-w-full min-w-0 flex flex-col group relative overflow-hidden",
                  "border border-border/60 bg-gradient-to-br from-background via-background to-primary/5",
                  "transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/40"
                )}
              >
                {/* Decorative gradient blob */}
                <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <CardHeader className="pb-3 relative min-w-0">
                  <div className="flex items-start gap-3 min-w-0">
                    <img
                      src={opp.image_url || "/placeholder.svg"}
                      alt={opp.title}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-muted ring-1 ring-border/50 shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-[10px] gap-1 bg-muted/60 text-muted-foreground border-border/60 font-medium"
                        >
                          <Sparkles className="h-2.5 w-2.5" />
                          {opp.source_name}
                        </Badge>
                        {type === "job" && getSectorBadge(opp.sector)}
                        {type === "scholarship" && getScopeBadge(opp.scholarship_scope)}
                      </div>
                      <CardTitle className="text-base sm:text-lg font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors break-words">
                        {opp.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 flex-1 flex flex-col min-w-0">
                  <p className="line-clamp-2 mb-3 text-xs text-muted-foreground break-words">
                    {opp.description || "No description available"}
                  </p>

                  <div className="space-y-1.5 text-xs text-muted-foreground mb-3 flex-1 min-w-0">
                    {opp.organization && (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Building2 className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate min-w-0">{opp.organization}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate min-w-0">{opp.location || "Location not specified"}</span>
                      {getRegionBadge(opp.region)}
                    </div>

                    {/* URGENCY: Deadline */}
                    <div
                      className={cn(
                        "flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded-md",
                        urgency.hasDeadline && urgency.pulse && "bg-red-50 dark:bg-red-950/30 ring-1 ring-red-200 dark:ring-red-900/50 animate-pulse",
                        urgency.hasDeadline && !urgency.pulse && "bg-muted/40"
                      )}
                    >
                      {urgency.pulse ? (
                        <Clock className={cn("h-3.5 w-3.5 flex-shrink-0", urgency.color)} />
                      ) : (
                        <Calendar className={cn("h-3.5 w-3.5 flex-shrink-0", urgency.color)} />
                      )}
                      <span className={cn("text-xs", urgency.color)}>
                        Deadline: {formatDate(opp.deadline_date)}
                      </span>
                    </div>
                  </div>

                  {(opp as any).status === "pending" && (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 mb-2 w-fit">
                      Pending Review
                    </Badge>
                  )}

                  {/* Full-width CTA — thumb-friendly on mobile */}
                  <Button
                    size="sm"
                    className="w-full gap-1.5 mt-2 font-semibold shadow-sm group-hover:shadow-md transition-shadow"
                    asChild
                  >
                    <Link to={`/opportunity/${generateSlugUrl(opp.title, opp.id)}`}>
                      <Eye className="h-3.5 w-3.5" />
                      View Details
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ExternalOpportunitiesSection;
