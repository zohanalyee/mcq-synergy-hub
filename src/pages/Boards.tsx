import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { toSlug } from '@/lib/slugUtils';
import SEOHead from '@/components/SEOHead';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, GraduationCap, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Boards = () => {
  const { data: systems, isLoading } = useQuery({
    queryKey: ['boards-index'],
    queryFn: async () => {
      const { data: systems, error } = await supabase
        .from('educational_systems')
        .select('id, name, type, description')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;

      // For each system, get its levels
      const withLevels = await Promise.all(
        (systems || []).map(async (sys) => {
          const { data: levels } = await supabase
            .from('levels')
            .select('id, name, order_index')
            .eq('system_id', sys.id)
            .order('order_index');
          return { ...sys, levels: levels || [] };
        })
      );
      return withLevels;
    },
    staleTime: 10 * 60 * 1000,
  });

  return (
    <Header>
      <SEOHead
        title="Boards – Browse by Educational Board"
        description="Browse MCQs by educational board and class. Practice for Sindh Board, Federal Board, Punjab Board, and more."
        keywords="Pakistan board MCQs, Sindh Board, Federal Board, Punjab Board, educational boards"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <PageBreadcrumb
        <h1 className="text-3xl font-bold text-foreground mb-2">Educational Boards</h1>
        <p className="text-muted-foreground mb-8">Browse MCQs organized by board and class level.</p>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {systems?.map((sys, i) => (
              <motion.div
                key={sys.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      {sys.type === 'academic' ? (
                        <GraduationCap className="h-5 w-5 text-primary" />
                      ) : (
                        <BookOpen className="h-5 w-5 text-primary" />
                      )}
                      <CardTitle className="text-lg">{sys.name}</CardTitle>
                    </div>
                    {sys.description && (
                      <p className="text-sm text-muted-foreground">{sys.description}</p>
                    )}
                    <Badge variant="secondary" className="w-fit text-xs">
                      {sys.type === 'academic' ? 'Academic' : 'Job Preparation'}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    {sys.levels.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {sys.levels.map((level) => {
                          const classMatch = level.name.match(/(\d+)/);
                          const classNum = classMatch ? classMatch[1] : level.name;
                          return (
                            <Link
                              key={level.id}
                              to={`/boards/${toSlug(sys.name)}/class-${classNum}`}
                              className="text-sm px-3 py-1.5 rounded-md bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                            >
                              {level.name}
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No classes available yet.</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </Header>
  );
};

export default Boards;
