import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, MapPin, Building2, ExternalLink, FileText,
  ArrowLeft, Briefcase, GraduationCap, Award, Loader2, Download,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { extractIdFromSlug } from "@/utils/slugify";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SafeMarkdownLink } from "@/components/SafeMarkdownLink";
import { sanitizeEmailLinks, mailtoForEmailHref, isBareEmailHref } from "@/lib/markdownSanitize";

const typeIcons: Record<string, React.ElementType> = {
  scholarship: GraduationCap,
  job: Briefcase,
  tender: FileText,
  board_result: Award,
};

const typeColors: Record<string, string> = {
  scholarship: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  job: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  tender: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  board_result: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const placeholderImages: Record<string, string> = {
  scholarship: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&fm=webp&q=70",
  job: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&fm=webp&q=70",
  tender: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&fm=webp&q=70",
  board_result: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&fm=webp&q=70",
};

const isPdfUrl = (url: string) => url.toLowerCase().endsWith('.pdf');

const breadcrumbForType = (type: string) => {
  switch (type) {
    case "job": return { label: "Jobs", href: "/jobs" };
    case "scholarship": return { label: "Scholarships", href: "/scholarships" };
    case "tender": return { label: "Tenders", href: "/tenders" };
    case "board_result": return { label: "Board Results", href: "/board-results" };
    default: return { label: "Opportunities", href: "/jobs" };
  }
};

/** Parse free-form salary string into Schema.org MonetaryAmount, or null if not numeric. */
const parseSalaryToMonetary = (raw?: string | null) => {
  if (!raw || typeof raw !== "string") return null;
  const s = raw.replace(/,/g, "").trim();
  // Reject pure pay-scale codes / vague text (BPS-17, Competitive, Negotiable, etc.)
  if (/^(bps|bs|grade|scale)[-\s]?\d+/i.test(s)) return null;
  if (/competitive|negotiable|market|as per|attractive/i.test(s)) return null;
  // Match a single number or numeric range like 50000-80000 or 50000 to 80000
  const range = s.match(/(\d{4,})\s*(?:-|to|–)\s*(\d{4,})/i);
  if (range) {
    const min = Number(range[1]);
    const max = Number(range[2]);
    if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max >= min) {
      return {
        "@type": "MonetaryAmount",
        currency: "PKR",
        value: { "@type": "QuantitativeValue", minValue: min, maxValue: max, unitText: "MONTH" },
      };
    }
  }
  const single = s.match(/(\d{4,})/);
  if (single) {
    const n = Number(single[1]);
    if (Number.isFinite(n) && n > 0) {
      return {
        "@type": "MonetaryAmount",
        currency: "PKR",
        value: { "@type": "QuantitativeValue", value: n, unitText: "MONTH" },
      };
    }
  }
  return null;
};

const cleanStr = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  if (/^(n\/?a|none|not specified|unspecified|null|undefined)$/i.test(t)) return null;
  return t;
};

const buildJsonLd = (op: any) => {
  const base: any = {
    "@context": "https://schema.org",
    name: op.title,
    description: op.description || `${op.type} opportunity from ${op.organization || op.source_name || "MCQsAI"}`,
    url: typeof window !== "undefined" ? window.location.href : `https://mcqsai.com/opportunity/${op.id}`,
    datePosted: op.created_at,
    ...(op.deadline_date && { validThrough: op.deadline_date }),
  };
  if (op.type === "job") {
    const locality = cleanStr(op.location);
    const address: Record<string, string> = {
      "@type": "PostalAddress",
      addressCountry: "PK",
    };
    if (locality) address.addressLocality = locality;

    const baseSalary = parseSalaryToMonetary(op.salary);
    const qualifications = cleanStr(op.qualification);
    const experience = cleanStr(op.experience);
    const orgName = cleanStr(op.organization) || cleanStr(op.source_name) || "MCQsAI";

    return {
      ...base,
      "@type": "JobPosting",
      title: op.title,
      employmentType: cleanStr(op.employment_type) || "FULL_TIME",
      hiringOrganization: { "@type": "Organization", name: orgName },
      jobLocation: { "@type": "Place", address },
      ...(baseSalary && { baseSalary }),
      ...(qualifications && { qualifications }),
      ...(experience && experience.length > 3 && { experienceRequirements: experience }),
    };
  }
  if (op.type === "scholarship") {
    return {
      ...base,
      "@type": "Scholarship",
      provider: { "@type": "Organization", name: op.organization || op.source_name || "MCQsAI" },
      areaServed: { "@type": "Country", name: "Pakistan" },
    };
  }
  return null;
};

const OpportunityDetail = () => {
  const { id: slugId } = useParams();
  const navigate = useNavigate();
  const id = extractIdFromSlug(slugId || "");

  const { data: opportunity, isLoading } = useQuery({
    queryKey: ["opportunity", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_opportunities")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Header>
        <div className="max-w-4xl mx-auto px-4 py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Header>
    );
  }

  if (!opportunity) {
    return (
      <Header>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h2 className="text-xl font-semibold mb-4">Opportunity not found</h2>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
          </Button>
        </div>
      </Header>
    );
  }

  const TypeIcon = typeIcons[opportunity.type] || FileText;
  const heroImage = opportunity.image_url || placeholderImages[opportunity.type] || placeholderImages.job;
  const hasRealImage = !!opportunity.image_url && !Object.values(placeholderImages).includes(opportunity.image_url);
  const hasPdf = !!opportunity.document_url && isPdfUrl(opportunity.document_url);
  const hasDocument = !!opportunity.document_url && !hasPdf;
  const keywords = (opportunity.metadata as any)?.keywords as string[] | undefined;

  const crumb = breadcrumbForType(opportunity.type);
  const jsonLd = buildJsonLd(opportunity);
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://mcqsai.com/" },
      { "@type": "ListItem", position: 2, name: crumb.label, item: `https://mcqsai.com${crumb.href}` },
      { "@type": "ListItem", position: 3, name: opportunity.title },
    ],
  };

  // Thin-content gate — must match OPPORTUNITY_MIN_WORDS in the sitemap/
  // inject-meta scripts (25 words). Kept low because jobs/scholarships are
  // time-sensitive; only near-empty listings are excluded from indexing.
  const oppWordCount = String(opportunity.description || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_>`~\-!\[\]()]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  const isThinOpp = oppWordCount < 25;

  return (
    <>
      <SEOHead
        title={`${opportunity.title} | MCQSAI`}
        description={opportunity.description?.substring(0, 160) || `${opportunity.type} opportunity from ${opportunity.organization || opportunity.source_name}`}
        keywords={keywords?.join(', ') || undefined}
        image={opportunity.image_url || undefined}
        noindex={isThinOpp}
      />
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Header>
        <div className="max-w-4xl mx-auto px-4 pt-4 pb-8">
          <nav className="text-sm text-muted-foreground mb-3" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <Link to={crumb.href} className="hover:text-primary">{crumb.label}</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground line-clamp-1 inline-block max-w-[60%] align-bottom">{opportunity.title}</span>
          </nav>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>

          <Card className="border-border/30 overflow-hidden">
            {/* Hero Image */}
            <div className="relative h-48 sm:h-64 bg-muted">
              <img
                src={heroImage}
                alt={`${opportunity.type?.replace('_', ' ')} opportunity: ${opportunity.title}`}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = placeholderImages[opportunity.type] || placeholderImages.job;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-3 left-4 flex gap-2">
                <Badge className={typeColors[opportunity.type] || ""}>
                  <TypeIcon className="h-3 w-3 mr-1" />
                  {opportunity.type?.replace('_', ' ')}
                </Badge>
                {opportunity.status === "pending" && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    Pending Review
                  </Badge>
                )}
              </div>
            </div>

            <CardContent className="p-5 sm:p-6 space-y-5">
              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-bold leading-tight">{opportunity.title}</h1>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {opportunity.organization && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" /> {opportunity.organization}
                  </span>
                )}
                {opportunity.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {opportunity.location}
                  </span>
                )}
                {opportunity.deadline_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Deadline: {new Date(opportunity.deadline_date).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Job specific fields — moved above description for quick facts */}
              {opportunity.type === "job" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {opportunity.qualification && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Qualification</p>
                      <p className="text-sm font-medium">{opportunity.qualification}</p>
                    </div>
                  )}
                  {opportunity.salary && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Salary</p>
                      <p className="text-sm font-medium text-emerald-500">{opportunity.salary}</p>
                    </div>
                  )}
                  {opportunity.experience && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Experience</p>
                      <p className="text-sm font-medium">{opportunity.experience}</p>
                    </div>
                  )}
                  {opportunity.positions && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Positions</p>
                      <p className="text-sm font-medium">{opportunity.positions}</p>
                    </div>
                  )}
                  {opportunity.department && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Department</p>
                      <p className="text-sm font-medium">{opportunity.department}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tender specific fields */}
              {opportunity.type === "tender" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {opportunity.tender_number && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Tender Number</p>
                      <p className="text-sm font-mono font-medium">{opportunity.tender_number}</p>
                    </div>
                  )}
                  {opportunity.tender_value && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Tender Value</p>
                      <p className="text-sm font-medium text-emerald-500">💰 {opportunity.tender_value}</p>
                    </div>
                  )}
                  {opportunity.tender_category && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Category</p>
                      <p className="text-sm font-medium">{opportunity.tender_category}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Scholarship specific fields */}
              {opportunity.type === "scholarship" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {opportunity.scholarship_scope && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Scope</p>
                      <p className="text-sm font-medium">{opportunity.scholarship_scope}</p>
                    </div>
                  )}
                  {opportunity.eligibility && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Eligibility</p>
                      <p className="text-sm font-medium">{opportunity.eligibility}</p>
                    </div>
                  )}
                  {opportunity.amount && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Amount</p>
                      <p className="text-sm font-medium text-emerald-500">{opportunity.amount}</p>
                    </div>
                  )}
                  {opportunity.field_of_study && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Field of Study</p>
                      <p className="text-sm font-medium">{opportunity.field_of_study}</p>
                    </div>
                  )}
                  {opportunity.education_level && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Education Level</p>
                      <p className="text-sm font-medium">{opportunity.education_level}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Description — markdown with GFM tables */}
              {opportunity.description && (
                <div>
                  <h2 className="text-sm font-semibold mb-2">Description</h2>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed
                    prose-headings:text-foreground prose-headings:font-semibold
                    prose-h2:text-base prose-h2:mt-4 prose-h2:mb-2
                    prose-h3:text-sm prose-h3:mt-3 prose-h3:mb-1.5
                    prose-strong:text-foreground prose-a:text-primary
                    prose-ul:my-2 prose-li:my-0.5">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-3 -mx-1">
                            <table className="w-full border-collapse text-xs" {...props} />
                          </div>
                        ),
                        thead: ({ node, ...props }) => <thead className="bg-muted/60" {...props} />,
                        th: ({ node, ...props }) => (
                          <th className="border border-border/50 px-2 py-1.5 text-left font-semibold text-foreground align-top" {...props} />
                        ),
                        td: ({ node, ...props }) => (
                          <td className="border border-border/40 px-2 py-1.5 text-left align-top [tbody_tr:nth-child(even)_&]:bg-muted/30" {...props} />
                        ),
                        tr: ({ node, ...props }) => <tr className="even:bg-muted/20" {...props} />,
                        a: SafeMarkdownLink,
                      }}
                    >
                      {sanitizeEmailLinks(opportunity.description)}
                    </ReactMarkdown>
                  </div>
                </div>
              )}



              {/* ========== NATIVE PDF VIEWER ========== */}
              {hasPdf && (
                <div className="space-y-2">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    📄 Original Notice / Document
                  </h2>
                  <div className="rounded-lg border border-border/40 overflow-hidden bg-muted/20">
                    <iframe
                      src={opportunity.document_url!}
                      className="w-full h-[600px] sm:h-[700px]"
                      title="Official Document PDF Viewer"
                      allow="fullscreen"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Can't see the PDF? <a href={opportunity.document_url!} target="_blank" rel="noopener noreferrer" className="underline text-primary">Open in new tab</a>
                  </p>
                </div>
              )}

              {/* ========== NATIVE IMAGE VIEWER (Original Ad) ========== */}
              {hasRealImage && (
                <div className="space-y-2">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    📰 Original Advertisement
                  </h2>
                  <div className="rounded-lg border border-border/40 overflow-hidden bg-muted/20 p-2">
                    <img
                      src={opportunity.image_url!}
                      alt={`${opportunity.title} - Original Notice`}
                      className="w-full rounded-md"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    This is the original advertisement as published. Read all details above before applying.
                  </p>
                </div>
              )}

              {/* SEO Keywords */}
              {keywords && keywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {keywords.map((k: string) => (
                    <Badge key={k} variant="outline" className="text-[9px]">{k}</Badge>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                {opportunity.apply_url && (
                  <a
                    href={mailtoForEmailHref(opportunity.apply_url)}
                    {...(isBareEmailHref(opportunity.apply_url)
                      ? { rel: "nofollow" }
                      : { target: "_blank", rel: "noopener noreferrer" })}
                  >
                    <Button>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {opportunity.type === "tender" ? "Visit Official Tender Page" : "Apply on Official Website"}
                    </Button>
                  </a>
                )}
                {(hasPdf || hasDocument) && (
                  <a href={opportunity.document_url!} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" /> Download Document
                    </Button>
                  </a>
                )}
              </div>

              {/* Footer meta */}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-2 border-t border-border/20">
                <span>Source: {opportunity.source_name}</span>
                {opportunity.created_at && (
                  <span>
                    Posted {formatDistanceToNow(new Date(opportunity.created_at), { addSuffix: true })}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </Header>
    </>
  );
};

export default OpportunityDetail;
