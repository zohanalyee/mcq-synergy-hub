import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { findBestMatch, findMatchingLevel, normalizeClassNumber, toSlug, toClassSegment } from '@/lib/slugUtils';
import SEOHead from '@/components/SEOHead';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const BoardClassPage = () => {
  const { boardSlug, classNumber } = useParams<{ boardSlug: string; classNumber: string }>();
  const navigate = useNavigate();
  const resolvedClassNumber = normalizeClassNumber(classNumber || '');

  const canonicalClassSeg = toClassSegment(classNumber || '');
  useEffect(() => {
    if (classNumber && canonicalClassSeg && classNumber !== canonicalClassSeg) {
      navigate(`/boards/${boardSlug}/${canonicalClassSeg}`, { replace: true });
    }
  }, [classNumber, canonicalClassSeg, boardSlug, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ['board-class', boardSlug, classNumber],
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

      const level = findMatchingLevel(levels || [], classNumber || '');
      if (!level) return { system, level: null, subjects: [] };

      const { data: subjects } = await supabase
        .from('subjects')
        .select('id, name, icon, description')
        .eq('level_id', level.id)
        .order('name');

      return { system, level, subjects: subjects || [] };
    },
    staleTime: 5 * 60 * 1000,
  });

  const boardName = data?.system?.name || boardSlug || '';
  const levelName = data?.level?.name || `Class ${resolvedClassNumber || classNumber}`;

  return (
    <Header>
      <SEOHead
        title={`${levelName} – ${boardName} Subjects`}
        description={`Browse ${boardName} ${levelName} subjects. Practice MCQs for all subjects.`}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <PageBreadcrumb items={[
          { title: 'Home', href: '/' },
          { title: 'Boards', href: '/boards' },
          { title: boardName, href: `/boards/${boardSlug}` },
          { title: levelName, href: '#', isCurrent: true },
        ]} />

        <h1 className="text-3xl font-bold text-foreground mb-2">{levelName} – {boardName}</h1>
        <p className="text-muted-foreground mb-8">Select a subject to browse topics and MCQs.</p>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !data?.level ? (
          <p className="text-muted-foreground text-center py-16">Class not found for this board.</p>
        ) : data.subjects.length === 0 ? (
          <p className="text-muted-foreground text-center py-16">No subjects available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.subjects.map((subject, i) => (
              <motion.div key={subject.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                 <Link to={`/boards/${boardSlug}/${toClassSegment(resolvedClassNumber || classNumber || '')}/${toSlug(subject.name)}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{subject.name}</CardTitle>
                      </div>
                      {subject.description && (
                        <p className="text-sm text-muted-foreground">{subject.description}</p>
                      )}
                    </CardHeader>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </Header>
  );
};

export default BoardClassPage;
