import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { findBestMatch, toSlug } from '@/lib/slugUtils';
import SEOHead from '@/components/SEOHead';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const BoardSubjectPage = () => {
  const { boardSlug, classNumber, subjectSlug } = useParams<{
    boardSlug: string; classNumber: string; subjectSlug: string;
  }>();

  const { data, isLoading } = useQuery({
    queryKey: ['board-subject', boardSlug, classNumber, subjectSlug],
    queryFn: async () => {
      const { data: systems } = await supabase
        .from('educational_systems')
        .select('id, name')
        .eq('is_active', true);

      const system = findBestMatch(systems || [], boardSlug || '');
      if (!system) return null;

      const { data: levels } = await supabase
        .from('levels')
        .select('id, name')
        .eq('system_id', system.id);

      const level = levels?.find(l => l.name.toLowerCase().includes(classNumber || ''));
      if (!level) return { system, level: null, subject: null, topics: [] };

      const { data: subjects } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('level_id', level.id);

      const subject = findBestMatch(subjects || [], subjectSlug || '');
      if (!subject) return { system, level, subject: null, topics: [] };

      const { data: topics } = await supabase
        .from('topics')
        .select('id, name')
        .eq('subject_id', subject.id)
        .order('name');

      return { system, level, subject, topics: topics || [] };
    },
    staleTime: 5 * 60 * 1000,
  });

  const boardName = data?.system?.name || boardSlug || '';
  const levelName = data?.level?.name || `Class ${classNumber}`;
  const subjectName = data?.subject?.name || subjectSlug || '';

  return (
    <Header>
      <SEOHead
        title={`${subjectName} Topics – ${levelName} ${boardName}`}
        description={`Browse ${subjectName} topics for ${levelName} (${boardName}). Practice MCQs topic by topic.`}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <PageBreadcrumb items={[
          { title: 'Home', href: '/' },
          { title: 'Boards', href: '/boards' },
          { title: boardName, href: `/boards/${boardSlug}` },
          { title: levelName, href: `/boards/${boardSlug}/class-${classNumber}` },
          { title: subjectName, href: '#', isCurrent: true },
        ]} />

        <h1 className="text-3xl font-bold text-foreground mb-2">{subjectName}</h1>
        <p className="text-muted-foreground mb-8">{levelName} · {boardName}</p>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !data?.subject ? (
          <p className="text-muted-foreground text-center py-16">Subject not found.</p>
        ) : data.topics.length === 0 ? (
          <p className="text-muted-foreground text-center py-16">No topics available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.topics.map((topic, i) => (
              <motion.div key={topic.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <Link to={`/boards/${boardSlug}/class-${classNumber}/${subjectSlug}/${toSlug(topic.name)}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center gap-3 py-4">
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm font-medium text-foreground">{topic.name}</span>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {data?.topics && data.topics.length > 0 && (
          <p className="text-xs text-muted-foreground mt-6">{data.topics.length} topic{data.topics.length !== 1 ? 's' : ''} available</p>
        )}
      </div>
      <Footer />
    </Header>
  );
};

export default BoardSubjectPage;
