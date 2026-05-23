import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Wrench, GraduationCap, FileText, Briefcase, School } from 'lucide-react';
import { getRelated, type EntityKind } from '@/data/semanticGraph';

const iconForKind: Record<EntityKind, typeof ArrowRight> = {
  exam: GraduationCap,
  subject: BookOpen,
  tool: Wrench,
  'scholarship-hub': School,
  'job-hub': Briefcase,
  'blog-topic': FileText,
  'seo-page': FileText,
};

interface RelatedContentProps {
  /** Entity slug — looked up in semanticGraph (e.g. 'mdcat', 'ecat-preparation'). */
  entitySlug: string;
  /** Optional filter to only show certain entity kinds. */
  kinds?: EntityKind[];
  /** Section heading. */
  title?: string;
  /** Max links shown (max 6 by editorial policy). */
  limit?: number;
}

/**
 * SEO-friendly related-content grid. Server-renderable, no effects.
 * Renders null when there are no curated relations — never an empty box.
 */
const RelatedContent = ({
  entitySlug,
  kinds,
  title = 'Related Resources',
  limit = 6,
}: RelatedContentProps) => {
  const items = getRelated(entitySlug, kinds, Math.min(limit, 6));
  if (!items.length) return null;

  return (
    <nav aria-label={title} className="mt-10">
      <h2 className="text-xl font-semibold text-foreground mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(item => {
          const Icon = iconForKind[item.kind];
          return (
            <Link
              key={`${item.kind}:${item.path}`}
              to={item.path}
              className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-primary/40 transition-colors group"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Icon className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground truncate">{item.label}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default RelatedContent;
