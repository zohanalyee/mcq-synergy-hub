import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fromSlug, toSlug } from '@/lib/slugUtils';
import SEOHead from '@/components/SEOHead';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PracticeMCQCard from '@/components/subject-content/PracticeMCQCard';
import TopicStatsBar from '@/components/board-topic/TopicStatsBar';
import PracticeModeButtons from '@/components/board-topic/PracticeModeButtons';
import RelatedTopics from '@/components/board-topic/RelatedTopics';
import TopicProgressCard from '@/components/board-topic/TopicProgressCard';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, BookOpen } from 'lucide-react';
import { cleanQuestionText } from '@/lib/questionUtils';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

interface MCQOption { key: string; text: string; }

const BoardTopicPage = () => {
  const { boardSlug, classNumber, subjectSlug, topicSlug } = useParams<{
    boardSlug: string;
    classNumber: string;
    subjectSlug: string;
    topicSlug: string;
  }>();

  const boardName = fromSlug(boardSlug || '');
  const subjectName = fromSlug(subjectSlug || '');
  const topicName = fromSlug(topicSlug || '');

  const { data, isLoading } = useQuery({
    queryKey: ['board-topic', boardSlug, classNumber, subjectSlug, topicSlug],
    queryFn: async () => {
      // 1. Find educational system
      const { data: sys } = await supabase
        .from('educational_systems')
        .select('id, name')
        .ilike('name', `%${boardName}%`)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!sys) return { mcqs: [], relatedTopics: [], resolvedNames: { board: boardName, subject: subjectName, topic: topicName } };

      // 2. Find level
      const { data: level } = await supabase
        .from('levels')
        .select('id, name')
        .eq('system_id', sys.id)
        .ilike('name', `%${classNumber}%`)
        .limit(1)
        .maybeSingle();

      if (!level) return { mcqs: [], relatedTopics: [], resolvedNames: { board: sys.name, subject: subjectName, topic: topicName } };

      // 3. Find subject
      const { data: subject } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('level_id', level.id)
        .ilike('name', `%${subjectName}%`)
        .limit(1)
        .maybeSingle();

      if (!subject) return { mcqs: [], relatedTopics: [], resolvedNames: { board: sys.name, subject: subjectName, topic: topicName } };

      // 4. Find topic
      const { data: topic } = await supabase
        .from('topics')
        .select('id, name')
        .eq('subject_id', subject.id)
        .ilike('name', `%${topicName}%`)
        .limit(1)
        .maybeSingle();

      // 5. Fetch related topics (sibling topics under same subject)
      const { data: relatedRaw } = await supabase
        .from('topics')
        .select('id, name')
        .eq('subject_id', subject.id)
        .neq('id', topic?.id || '')
        .limit(8);

      const resolvedNames = {
        board: sys.name,
        subject: subject.name,
        topic: topic?.name || topicName,
        subjectId: subject.id,
      };

      // 6. Fetch MCQs
      let mcqQuery = supabase
        .from('content_items')
        .select('id, title, options, correct_option, explanation, difficulty')
        .eq('category', 'mcq')
        .eq('status', 'approved')
        .limit(50);

      if (topic) {
        mcqQuery = mcqQuery.eq('topic_id', topic.id);
      } else {
        const canonical = toSlug(topicName);
        mcqQuery = mcqQuery.eq('canonical_topic_name', canonical);
      }

      const { data: mcqs } = await mcqQuery;
      return { mcqs: mcqs || [], relatedTopics: relatedRaw || [], resolvedNames };
    },
    staleTime: 5 * 60 * 1000,
  });

  const mcqs = data?.mcqs || [];
  const relatedTopics = data?.relatedTopics || [];
  const names = data?.resolvedNames || { board: boardName, subject: subjectName, topic: topicName };
  const subjectId = (names as any).subjectId;

  const seoTitle = `${names.topic} MCQs - ${names.subject} Class ${classNumber} | ${names.board}`;
  const seoDesc = `Practice ${names.topic} MCQs for ${names.subject} Class ${classNumber} (${names.board}). Free online preparation with explanations.`;

  // Quiz schema for rich results
  const quizSchema = mcqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: seoTitle,
    about: { '@type': 'Thing', name: names.topic },
    educationalLevel: `Class ${classNumber}`,
    numberOfQuestions: mcqs.length,
    provider: { '@type': 'Organization', name: 'MCQsAI', url: 'https://mcqsai.com' },
  } : null;

  return (
    <Header>
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        keywords={`${names.topic} MCQs, ${names.subject} class ${classNumber}, ${names.board} preparation, Pakistan exam MCQs`}
      />
      {quizSchema && (
        <Helmet>
          <script type="application/ld+json">{JSON.stringify(quizSchema)}</script>
        </Helmet>
      )}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <PageBreadcrumb
          items={[
            { title: 'Home', href: '/' },
            { title: 'Boards', href: '/boards' },
            { title: names.board, href: `/boards/${boardSlug}` },
            { title: `Class ${classNumber}`, href: `/boards/${boardSlug}/class-${classNumber}` },
            { title: names.subject, href: `/boards/${boardSlug}/class-${classNumber}/${subjectSlug}` },
            { title: names.topic, href: '#', isCurrent: true },
          ]}
        />

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
          {names.topic} MCQs
        </h1>
        <p className="text-muted-foreground mb-3">
          {names.subject} · Class {classNumber} · {names.board}
        </p>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : mcqs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 space-y-4"
          >
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/40" />
            <h2 className="text-xl font-semibold text-foreground">
              No MCQs available for {names.topic} yet
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              We're working on adding questions for this topic. In the meantime, try generating a practice test with AI!
            </p>
            {subjectId && (
              <Link to={`/subject/${subjectId}?topic=${encodeURIComponent(names.topic)}`}>
                <Button className="mt-4 gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate Practice Test with AI
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <>
            <TopicStatsBar mcqs={mcqs} />

            <TopicProgressCard topicName={names.topic} subjectName={names.subject} />

            {subjectId && (
              <PracticeModeButtons subjectId={subjectId} topicName={names.topic} />
            )}

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{mcqs.length} question{mcqs.length !== 1 ? 's' : ''} found</p>
              {mcqs.map((mcq, index) => {
                const options: MCQOption[] = Array.isArray(mcq.options)
                  ? (mcq.options as any[]).map((o: any) => ({ key: o.key || '', text: o.text || '' }))
                  : [];
                return (
                  <PracticeMCQCard
                    key={mcq.id}
                    id={mcq.id}
                    title={`Q${index + 1}`}
                    question={cleanQuestionText(mcq.title)}
                    options={options}
                    correctOption={mcq.correct_option || ''}
                    explanation={mcq.explanation || ''}
                    difficulty={(mcq.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Medium'}
                    mode="practice"
                    index={index}
                  />
                );
              })}
            </div>

            <RelatedTopics
              topics={relatedTopics}
              boardSlug={boardSlug || ''}
              classNumber={classNumber || ''}
              subjectSlug={subjectSlug || ''}
            />
          </>
        )}
      </div>
      <Footer />
    </Header>
  );
};

export default BoardTopicPage;
