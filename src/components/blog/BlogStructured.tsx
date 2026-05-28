/**
 * Structured blog presentation components used by BlogPost.
 * All visual styling uses semantic tokens (no hardcoded colors).
 */
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowUpRight, ShieldCheck, Clock, CalendarCheck, Link2 } from "lucide-react";
import { format } from "date-fns";

export interface HighlightItem { label: string; value: string }
export interface Highlights { type?: string; items: HighlightItem[] }
export interface BlogTableData { title?: string; headers: string[]; rows: string[][] }
export interface FAQItem { q: string; a: string }
export interface InternalLink { anchor: string; href: string; context?: string }
export interface PrepBlock { title: string; description: string; href: string; cta: string }
export interface SourceLink { label: string; url: string }
export interface JobPostingData {
  title?: string;
  hiringOrganization?: string;
  datePosted?: string;
  validThrough?: string;
  employmentType?: string;
  jobLocation?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  baseSalary?: { currency?: string; value?: string; unitText?: string };
}

/* ---------------- Trust Strip ---------------- */
export const BlogTrustStrip = ({
  lastUpdated,
  readingMinutes,
  hasSource,
}: { lastUpdated?: string | null; readingMinutes?: number | null; hasSource?: boolean }) => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground border-y border-border py-2.5 my-4">
    <span className="inline-flex items-center gap-1.5">
      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
      Reviewed by MCQSAI Editorial Team
    </span>
    {lastUpdated && (
      <span className="inline-flex items-center gap-1.5">
        <CalendarCheck className="h-3.5 w-3.5" />
        Last updated: {format(new Date(lastUpdated), "MMM d, yyyy")}
      </span>
    )}
    {readingMinutes ? (
      <span className="inline-flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        {readingMinutes} min read
      </span>
    ) : null}
    {hasSource && <span className="inline-flex items-center gap-1.5"><Link2 className="h-3.5 w-3.5" />Verified from official source</span>}
  </div>
);

/* ---------------- Highlights Card ---------------- */
export const BlogHighlightsCard = ({ highlights }: { highlights: Highlights | null | undefined }) => {
  if (!highlights?.items?.length) return null;
  return (
    <Card className="p-4 my-5 bg-gradient-to-br from-primary/5 to-transparent border-primary/30">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-primary mb-3">Key Highlights</h2>
      <dl className="grid gap-2.5 sm:grid-cols-2">
        {highlights.items.map((item, i) => (
          <div key={i} className="flex flex-col">
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{item.label}</dt>
            <dd className="text-sm font-medium text-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
};

/* ---------------- TOC ---------------- */
export const BlogTOC = ({ markdown }: { markdown: string }) => {
  const headings = Array.from(markdown.matchAll(/^##\s+(.+)$/gm)).map(m => m[1].trim());
  if (headings.length < 4) return null;
  return (
    <nav aria-label="Table of contents" className="my-5 p-3 rounded-md border border-border bg-muted/40">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">On this page</p>
      <ol className="space-y-1 text-sm">
        {headings.map((h, i) => {
          const id = h.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          return (
            <li key={i}>
              <a href={`#${id}`} className="text-primary hover:underline">{i + 1}. {h}</a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

/* ---------------- Standalone Tables ---------------- */
export const BlogTables = ({ tables }: { tables: BlogTableData[] | null | undefined }) => {
  if (!tables?.length) return null;
  return (
    <div className="space-y-5 my-5">
      {tables.map((t, i) => (
        <div key={i}>
          {t.title && <h3 className="text-base font-semibold mb-2">{t.title}</h3>}
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr>{t.headers.map((h, hi) => (
                  <th key={hi} className="text-left px-3 py-2 font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {t.rows.map((row, ri) => (
                  <tr key={ri} className="border-t border-border">
                    {row.map((c, ci) => <td key={ci} className="px-3 py-2 align-top">{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ---------------- FAQ (emits single FAQPage JSON-LD) ---------------- */
export const BlogFAQ = ({ faqs }: { faqs: FAQItem[] | null | undefined }) => {
  if (!faqs?.length) return null;
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <section className="my-8">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>
      <h2 className="text-xl font-bold mb-3">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left text-sm font-medium">{f.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};

/* ---------------- Preparation Funnel ---------------- */
export const BlogPrepFunnel = ({ blocks, heading = "Prepare for This Test" }: { blocks: PrepBlock[] | null | undefined; heading?: string }) => {
  if (!blocks?.length) return null;
  return (
    <section className="my-7">
      <h2 className="text-lg font-bold mb-3">{heading}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {blocks.map((b, i) => (
          <Card key={i} className="p-3.5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{b.title}</h3>
              {b.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{b.description}</p>}
            </div>
            <Link to={b.href} className="mt-3 inline-block">
              <Button size="sm" variant="default" className="w-full">
                {b.cta} <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
};

/* ---------------- Internal Links footer ---------------- */
export const BlogInternalLinks = ({ links }: { links: InternalLink[] | null | undefined }) => {
  if (!links?.length) return null;
  return (
    <section className="my-6">
      <h2 className="text-base font-bold mb-2">Related on MCQSAI</h2>
      <ul className="grid gap-1.5 sm:grid-cols-2 text-sm">
        {links.map((l, i) => (
          <li key={i}>
            <Link to={l.href} className="text-primary hover:underline">{l.anchor}</Link>
            {l.context && <span className="text-muted-foreground"> — {l.context}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
};

/* ---------------- Official Sources ---------------- */
export const BlogSources = ({ sources }: { sources: SourceLink[] | null | undefined }) => {
  if (!sources?.length) return null;
  return (
    <section className="my-6 p-3.5 rounded-md border border-border bg-muted/30">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Official Sources</h2>
      <ul className="space-y-1.5 text-sm">
        {sources.map((s, i) => (
          <li key={i}>
            <a href={s.url} target="_blank" rel="nofollow noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
              {s.label} <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-muted-foreground mt-2">
        This article is for educational purposes. Always verify deadlines and eligibility from the official source before applying.
      </p>
    </section>
  );
};

/* ---------------- JobPosting Schema ---------------- */
export const JobPostingSchema = ({ data, url, title, description, datePosted }: {
  data: JobPostingData;
  url: string;
  title: string;
  description?: string;
  datePosted?: string;
}) => {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: data.title || title,
    description: description || title,
    url,
    datePosted: data.datePosted || datePosted,
    identifier: { "@type": "PropertyValue", name: data.hiringOrganization || "MCQSAI", value: url },
  };
  if (data.validThrough) schema.validThrough = data.validThrough;
  if (data.employmentType) schema.employmentType = data.employmentType;
  if (data.hiringOrganization) {
    schema.hiringOrganization = {
      "@type": "Organization",
      name: data.hiringOrganization,
      sameAs: "https://mcqsai.com",
    };
  }
  if (data.jobLocation && Object.keys(data.jobLocation).length) {
    schema.jobLocation = {
      "@type": "Place",
      address: { "@type": "PostalAddress", ...data.jobLocation, addressCountry: data.jobLocation.addressCountry || "PK" },
    };
  }
  if (data.baseSalary?.value) {
    schema.baseSalary = {
      "@type": "MonetaryAmount",
      currency: data.baseSalary.currency || "PKR",
      value: { "@type": "QuantitativeValue", value: data.baseSalary.value, unitText: data.baseSalary.unitText || "MONTH" },
    };
  }
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

/* ---------------- HowTo Schema (Study Guides / Preparation Tips) ---------------- */
export const HowToSchema = ({
  name,
  description,
  url,
  steps,
  totalTimeMinutes,
}: {
  name: string;
  description?: string;
  url: string;
  steps: { name: string; text: string }[];
  totalTimeMinutes?: number;
}) => {
  if (!steps?.length) return null;
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description: description || name,
    url,
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      url: `${url}#step-${i + 1}`,
    })),
  };
  if (totalTimeMinutes) schema.totalTime = `PT${totalTimeMinutes}M`;
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};
