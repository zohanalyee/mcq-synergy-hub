import { Link } from 'react-router-dom';
import { ArrowRight, Target } from 'lucide-react';
import { semanticGraph, type Relation } from '@/data/semanticGraph';

interface RelatedExamsToolsProps {
  subjectName: string;
  /** Optional heading override. */
  heading?: string;
}

/**
 * Curated subject → exam/tool bridging, driven entirely by the hand-curated
 * semanticGraph (no runtime AI, no auto-generation). Maps a subject name to
 * the exams/tools a learner would logically prepare for, then renders crawlable
 * <Link> anchors. Returns null when nothing curated matches.
 */
const SUBJECT_EXAM_KEYS: Array<{ test: RegExp; keys: string[] }> = [
  { test: /biolog/i, keys: ['mdcat'] },
  { test: /chemist/i, keys: ['mdcat', 'ecat'] },
  { test: /physic/i, keys: ['ecat', 'mdcat'] },
  { test: /math/i, keys: ['ecat'] },
  { test: /comput/i, keys: ['ecat', 'nts'] },
  { test: /english|urdu|islam|pak.?stud|general|social|civic/i, keys: ['css', 'nts'] },
];

export function getSubjectExamRelations(subjectName: string): Relation[] {
  const keys = new Set<string>();
  for (const { test, keys: ks } of SUBJECT_EXAM_KEYS) {
    if (test.test(subjectName)) ks.forEach((k) => keys.add(k));
  }
  // Every academic subject also bridges to general board practice.
  keys.add('board-mcqs');

  const seen = new Set<string>();
  const out: Relation[] = [];
  for (const key of keys) {
    for (const rel of semanticGraph[key] || []) {
      if (seen.has(rel.path)) continue;
      seen.add(rel.path);
      out.push(rel);
    }
  }
  // High priority first, cap the cluster.
  const rank = { high: 0, medium: 1, low: 2 } as const;
  return out
    .sort((a, b) => (rank[a.priority || 'medium'] - rank[b.priority || 'medium']))
    .slice(0, 6);
}

const RelatedExamsTools = ({ subjectName, heading = 'Related exams & prep tools' }: RelatedExamsToolsProps) => {
  const relations = getSubjectExamRelations(subjectName);
  if (relations.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-foreground mb-4">{heading}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {relations.map((rel) => (
          <Link
            key={rel.path + rel.label}
            to={rel.path}
            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group"
          >
            <Target className="h-5 w-5 text-primary shrink-0" />
            <span className="flex-1 text-sm font-medium text-foreground">{rel.label}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedExamsTools;
