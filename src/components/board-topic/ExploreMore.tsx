import { Link } from 'react-router-dom';
import { ArrowRight, Layers, GraduationCap, BookOpen, LibraryBig } from 'lucide-react';

interface ExploreMoreProps {
  boardName: string;
  subjectName: string;
  classNumber: string;
  boardSlug: string;
  classSeg: string;
  subjectSlug: string;
}

/**
 * Crawlable upward + lateral internal links shown on every board/topic page
 * (populated or empty) so link equity flows to parent hubs and topics are
 * never dead-ends. Plain <Link> anchors with descriptive text for AEO.
 */
const ExploreMore = ({
  boardName, subjectName, classNumber, boardSlug, classSeg, subjectSlug,
}: ExploreMoreProps) => {
  const links = [
    {
      to: `/boards/${boardSlug}/${classSeg}/${subjectSlug}`,
      label: `All ${subjectName} topics`,
      sub: `Class ${classNumber} · ${boardName}`,
      Icon: BookOpen,
    },
    {
      to: `/boards/${boardSlug}/${classSeg}`,
      label: `Class ${classNumber} subjects`,
      sub: boardName,
      Icon: Layers,
    },
    {
      to: `/boards/${boardSlug}`,
      label: `${boardName} home`,
      sub: 'All classes & subjects',
      Icon: GraduationCap,
    },
    {
      to: '/boards',
      label: 'Browse all boards',
      sub: 'Pakistan educational boards',
      Icon: LibraryBig,
    },
  ];

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-foreground mb-4">Explore more</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {links.map(({ to, label, sub, Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group"
          >
            <Icon className="h-5 w-5 text-primary shrink-0" />
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-foreground truncate">{label}</span>
              <span className="block text-xs text-muted-foreground truncate">{sub}</span>
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
};

export default ExploreMore;
