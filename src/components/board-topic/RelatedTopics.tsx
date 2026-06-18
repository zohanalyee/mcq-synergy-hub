import { Link } from 'react-router-dom';
import { toSlug, toClassSegment } from '@/lib/slugUtils';
import { ArrowRight } from 'lucide-react';

interface RelatedTopic {
  id: string;
  name: string;
}

interface RelatedTopicsProps {
  topics: RelatedTopic[];
  boardSlug: string;
  classNumber: string;
  subjectSlug: string;
}

const RelatedTopics = ({ topics, boardSlug, classNumber, subjectSlug }: RelatedTopicsProps) => {
  if (!topics.length) return null;

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-foreground mb-4">Related Topics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {topics.map((topic) => (
          <Link
            key={topic.id}
            to={`/boards/${boardSlug}/${toClassSegment(classNumber)}/${subjectSlug}/${toSlug(topic.name)}`}
            className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group"
          >
            <span className="text-sm font-medium text-foreground">{topic.name}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedTopics;
