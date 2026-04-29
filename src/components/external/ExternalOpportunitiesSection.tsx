import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  Building2,
  MapPin,
  Briefcase,
  GraduationCap,
  Globe,
  Building,
  Clock,
  Hourglass,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      day: "numeric",
    });
  };

  // Returns deadline badge styling tier based on days remaining
  const getDeadlineMeta = (dateString: string | null) => {
    if (!dateString) {
      return {
        tier: "none" as const,
        label: "No deadline",
        Icon: Calendar,
        className: "bg-muted/50 text-muted-foreground",
        pulse: false,
      };
    }
    const days = Math.ceil((new Date(dateString).getTime() - Date.now()) / 86400000);
    const label = `Deadline: ${formatDate(dateString)}`;
    if (days < 0) {
      return {
        tier: "expired" as const,
        label,
        Icon: Calendar,
        className: "bg-gray-100 text-gray-500 line-through dark:bg-gray-800/60 dark:text-gray-500",
        pulse: false,
      };
    }
    if (days <= 7) {
      return {
        tier: "urgent" as const,
        label: `${days}d left`,
        Icon: Hourglass,
        className:
          "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/50",
        pulse: true,
      };
    }
    if (days <= 30) {
      return {
        tier: "soon" as const,
        label: `${days}d left`,
        Icon: Clock,
        className:
          "bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:ring-orange-900/50",
        pulse: false,
      };
    }
    return {
      tier: "ok" as const,
      label,
      Icon: Calendar,
      className:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
      pulse: false,
    };
  };

  const TypeIcon = type === "job" ? Briefcase : GraduationCap;
  const sectionTitle = type === "job" ? "External Jobs" : "External Scholarships";
  const description =
    type === "job"
      ? "Curated job opportunities from LinkedIn, Indeed, and more"
      : "Curated scholarships from HEC, Fulbright, and more";
  const ctaLabel = type === "job" ? "Apply" : "View";

  // Pastel pill badges
  const pillBase =
    "rounded-full px-2.5 py-0.5 text-[10px] font-semibold gap-1 border-0 inline-flex items-center";

  const getSectorBadge = (sector: string | null) => {
    if (!sector) return null;
    const isGovt = sector === "government";
    return (
      <Badge
        className={cn(
          pillBase,
          isGovt
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
            : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
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
      sindh: "Sindh",
      punjab: "Punjab",
      kpk: "KPK",
      balochistan: "Balochistan",
      federal: "Federal",
      international: "International",
    };
    const isIntl = region === "international";
    return (
      <Badge
        className={cn(
          pillBase,
          isIntl
            ? "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300"
            : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
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
          pillBase,
          isIntl
            ? "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300"
            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
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
          <h2 className="text-xl font-semibold">{sectionTitle}</h2>
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

  if (opportunities.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="mt-8"
    >
      <div className="flex items-center gap-2 mb-2">
        <TypeIcon className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">{sectionTitle}</h2>
        <Badge variant="secondary" className="ml-2">
          {opportunities.length}
        </Badge>
      </div>
      <p className="text-muted-foreground text-sm mb-4">{description}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full">
        {opportunities.map((opp, index) => {
          const dl = getDeadlineMeta(opp.deadline_date);
          const detailHref = `/opportunity/${generateSlugUrl(opp.title, opp.id)}`;
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
                  "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10",
                  "hover:ring-1 hover:ring-primary/20 hover:border-primary/40"
                )}
              >
                {/* Decorative gradient blob — stronger on hover */}
                <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/10 blur-3xl opacity-30 group-hover:opacity-100 transition-opacity duration-500" />

                <CardHeader className="pb-2 pt-5 px-5 relative min-w-0">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Squircle logo */}
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-xl bg-white dark:bg-white/95 border border-gray-100 dark:border-white/10 shadow-sm p-1 flex items-center justify-center overflow-hidden"
                      title={opp.source_name || undefined}
                    >
                      <img
                        src={opp.image_url || "/placeholder.svg"}
                        alt={opp.title}
                        className="w-full h-full object-contain rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                        loading="lazy"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        {type === "job" && getSectorBadge(opp.sector)}
                        {type === "scholarship" && getScopeBadge(opp.scholarship_scope)}
                        {getRegionBadge(opp.region)}
                        {(opp as any).status === "pending" && (
                          <Badge
                            className={cn(
                              pillBase,
                              "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                            )}
                          >
                            Pending
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base font-semibold text-gray-900 dark:text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors break-words">
                        {opp.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 pb-4 px-5 flex-1 flex flex-col min-w-0">
                  <p className="line-clamp-2 mb-3 text-xs text-muted-foreground break-words">
                    {opp.description || "No description available"}
                  </p>

                  <div className="space-y-1.5 text-sm text-gray-500 dark:text-muted-foreground mb-4 flex-1 min-w-0">
                    {opp.organization && (
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate min-w-0">{opp.organization}</span>
                      </div>
                    )}
                    {opp.location && (
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate min-w-0">{opp.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer: deadline badge (left) + pill CTA (right) */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/40 mt-auto">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium max-w-[60%]",
                        dl.className,
                        dl.pulse && "animate-pulse"
                      )}
                      title={dl.label}
                    >
                      <dl.Icon className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{dl.label}</span>
                    </span>

                    <Link
                      to={detailHref}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold",
                        "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground",
                        "transition-all duration-200 group-hover:translate-x-0.5"
                      )}
                      aria-label={`${ctaLabel} ${opp.title}`}
                    >
                      {ctaLabel}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
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
