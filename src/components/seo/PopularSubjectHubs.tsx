import { Link } from 'react-router-dom';
import { ArrowRight, Flame } from 'lucide-react';

// Top 10 subject hubs by Google Search Console impressions, 90 days to
// 14 Oct 2026 (topic + hub URLs rolled up per hub). Static list on purpose —
// re-rank by hand from fresh GSC data; every path must be a live indexable hub.
export const POPULAR_SUBJECT_HUBS: { href: string; subject: string; meta: string }[] = [
  { href: '/boards/sindh-text-book-board/class-11/biology-class-11', subject: 'Biology', meta: 'Class 11 · Sindh Board' },
  { href: '/boards/sindh-text-book-board/class-10/english', subject: 'English', meta: 'Class 10 · Sindh Board' },
  { href: '/boards/punjab-curriculum-and-textbook-board/class-8/science', subject: 'Science', meta: 'Class 8 · Punjab Board' },
  { href: '/boards/punjab-curriculum-and-textbook-board/class-4/general-science', subject: 'General Science', meta: 'Class 4 · Punjab Board' },
  { href: '/boards/sindh-text-book-board/class-10/physics', subject: 'Physics', meta: 'Class 10 · Sindh Board' },
  { href: '/boards/punjab-curriculum-and-textbook-board/class-7/science', subject: 'Science', meta: 'Class 7 · Punjab Board' },
  { href: '/boards/punjab-curriculum-and-textbook-board/class-5/general-science', subject: 'General Science', meta: 'Class 5 · Punjab Board' },
  { href: '/boards/sindh-text-book-board/class-9/english', subject: 'English', meta: 'Class 9 · Sindh Board' },
  { href: '/boards/punjab-curriculum-and-textbook-board/class-10/mathematics', subject: 'Mathematics', meta: 'Class 10 · Punjab Board' },
  { href: '/boards/sindh-text-book-board/class-10/mathematics', subject: 'Mathematics', meta: 'Class 10 · Sindh Board' },
];

const PopularSubjectHubs = ({ className = '' }: { className?: string }) => (
  <section aria-labelledby="popular-hubs-heading" className={className}>
    <h2 id="popular-hubs-heading" className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
      <Flame className="h-5 w-5 text-primary" aria-hidden="true" />
      Most Practiced Subject Hubs
    </h2>
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {POPULAR_SUBJECT_HUBS.map((h) => (
        <li key={h.href}>
          <Link
            to={h.href}
            className="flex items-center justify-between gap-2 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group h-full"
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground truncate">{h.subject} MCQs</span>
              <span className="block text-xs text-muted-foreground truncate">{h.meta}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  </section>
);

export default PopularSubjectHubs;
