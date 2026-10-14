import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';

interface Item { href: string; name: string }

const TopicPrevNext = ({ prev, next, hubHref, subjectName }: { prev: Item | null; next: Item | null; hubHref: string; subjectName: string }) => (
  <nav aria-label="Topic navigation" className="mt-10 space-y-3">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {prev ? (
        <Link to={prev.href} rel="prev" className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group">
          <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-xs text-muted-foreground">Previous topic</span>
            <span className="block text-sm font-medium text-foreground truncate">{prev.name}</span>
          </span>
        </Link>
      ) : <span className="hidden sm:block" />}
      {next && (
        <Link to={next.href} rel="next" className="flex items-center justify-end gap-2 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group text-right">
          <span className="min-w-0">
            <span className="block text-xs text-muted-foreground">Next topic</span>
            <span className="block text-sm font-medium text-foreground truncate">{next.name}</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
        </Link>
      )}
    </div>
    <Link to={hubHref} className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors text-sm font-medium text-foreground group">
      <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
      View all {subjectName} topics
    </Link>
  </nav>
);

export default TopicPrevNext;
