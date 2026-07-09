import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { findBestMatch, toSlug, toClassSegment } from '@/lib/slugUtils';
import SEOHead from '@/components/SEOHead';
import indexableHubs from '@/generated/indexableHubs.json';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

const BoardLandingPage = () => {
  const { boardSlug } = useParams<{ boardSlug: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['board-landing', boardSlug],
    queryFn: async () => {
      const { data: systems } = await supabase
        .from('educational_systems')
        .select('id, name, description')
        .eq('is_active', true);

      const system = findBestMatch(systems || [], boardSlug || '');
      if (!system) return null;

      const { data: levels } = await supabase
        .from('levels')
        .select('id, name, order_index')
        .eq('system_id', system.id)
        .order('order_index');

      return { system, levels: levels || [] };
    },
    staleTime: 5 * 60 * 1000,
  });

  const boardName = data?.system?.name || boardSlug || '';

  return (
    <Header>
      <SEOHead
        title={`${boardName} MCQs 2026 — All Classes & Subjects`}
        description={`Free ${boardName} MCQs with answers for all classes and subjects. AI-powered practice with instant feedback — MCQsAI Pakistan.`}
        keywords={`${boardName} MCQs, ${boardName} past papers, ${boardName} class 9, ${boardName} class 10, ${boardName} class 11, ${boardName} class 12, Pakistan board MCQs`}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <PageBreadcrumb items={[
          { title: 'Home', href: '/' },
          { title: 'Boards', href: '/boards' },
          { title: boardName, href: '#', isCurrent: true },
        ]} />

        <h1 className="text-3xl font-bold text-foreground mb-2">{boardName}</h1>
        <p className="text-muted-foreground mb-8">Select your class to browse subjects and topics.</p>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !data ? (
          <p className="text-muted-foreground text-center py-16">Board not found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {data.levels.map((level, i) => {
              const classMatch = level.name.match(/(\d+)/);
              const classNum = classMatch ? classMatch[1] : level.name;
              return (
                <motion.div key={level.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                   <Link to={`/boards/${boardSlug}/${toClassSegment(classNum)}`}>
                    <Card className="hover:shadow-lg transition-shadow text-center">
                      <CardHeader className="pb-2">
                        <GraduationCap className="h-8 w-8 mx-auto text-primary" />
                      </CardHeader>
                      <CardContent>
                        <CardTitle className="text-base">{level.name}</CardTitle>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </Header>
  );
};

export default BoardLandingPage;
