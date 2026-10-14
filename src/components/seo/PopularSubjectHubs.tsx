import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Dna, BookOpen, Atom, Calculator, FlaskConical } from 'lucide-react';

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

const iconFor = (subject: string) => {
  const s = subject.toLowerCase();
  if (s.includes('biology')) return Dna;
  if (s.includes('english')) return BookOpen;
  if (s.includes('physics')) return Atom;
  if (s.includes('math')) return Calculator;
  return FlaskConical;
};

const PopularSubjectHubs = ({ className = '' }: { className?: string }) => (
  <section aria-labelledby="popular-hubs-heading" className={className}>
    <h2 id="popular-hubs-heading" className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
      <Flame className="h-5 w-5 text-primary" aria-hidden="true" />
      Most Practiced Subject Hubs
    </h2>
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {POPULAR_SUBJECT_HUBS.map((h, i) => {
        const Icon = iconFor(h.subject);
        const [cls, board] = h.meta.split(' · ');
        return (
          <li key={h.href}>
            <Link
              to={h.href}
              className="group relative flex h-full flex-col gap-2.5 overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-3 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
            >
              <span aria-hidden="true" className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-primary/15 blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-60" />
              <span className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground">#{i + 1}</span>
              </span>
              <span className="block text-sm font-semibold text-foreground truncate">{h.subject} MCQs</span>
              <span className="flex flex-wrap gap-1">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{cls}</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">{board}</span>
              </span>
              <span className="mt-auto flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                Practice now
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  </section>
);

export default PopularSubjectHubs;
