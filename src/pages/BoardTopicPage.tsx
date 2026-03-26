import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fromSlug, toSlug, findBestMatch } from '@/lib/slugUtils';
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
import { Loader2, Sparkles, BookOpen, AlertTriangle } from 'lucide-react';
import { cleanQuestionText } from '@/lib/questionUtils';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { trackEmptyTopicView } from '@/utils/analytics';
import { supabase as supabaseClient } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useUserRole } from '@/contexts/UserRoleContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface MCQOption { key: string; text: string; }

interface DebugInfo {
  systemFound: boolean; systemName: string | null; systemsChecked: number;
  levelFound: boolean; levelName: string | null; levelsChecked: number;
  subjectFound: boolean; subjectName: string | null; subjectsChecked: number;
  topicFound: boolean; topicName: string | null; topicsChecked: number;
  mcqCount: number; slugsUsed: { board: string; class: string; subject: string; topic: string };
}

const BoardTopicPage = () => {
  const { boardSlug, classNumber, subjectSlug, topicSlug } = useParams<{
    boardSlug: string; classNumber: string; subjectSlug: string; topicSlug: string;
  }>();
  const { isAdmin } = useUserRole();

  const boardName = fromSlug(boardSlug || '');
  const subjectName = fromSlug(subjectSlug || '');
  const topicName = fromSlug(topicSlug || '');

  const { data, isLoading } = useQuery({
    queryKey: ['board-topic', boardSlug, classNumber, subjectSlug, topicSlug, isAdmin],
    queryFn: async () => {
      const debug: DebugInfo = {
        systemFound: false, systemName: null, systemsChecked: 0,
        levelFound: false, levelName: null, levelsChecked: 0,
        subjectFound: false, subjectName: null, subjectsChecked: 0,
        topicFound: false, topicName: null, topicsChecked: 0,
        mcqCount: 0, slugsUsed: { board: boardSlug || '', class: classNumber || '', subject: subjectSlug || '', topic: topicSlug || '' },
      };
      const empty = { mcqs: [], relatedTopics: [], resolvedNames: { board: boardName, subject: subjectName, topic: topicName }, debug };

      // 1. Find educational system via fuzzy match
      const { data: allSystems } = await supabase
        .from('educational_systems').select('id, name').eq('is_active', true);
      debug.systemsChecked = allSystems?.length || 0;

      const sys = findBestMatch(allSystems || [], boardSlug || '');
      if (!sys) return empty;
      debug.systemFound = true;
      debug.systemName = sys.name;

      // 2. Find level
      const { data: allLevels } = await supabase
        .from('levels').select('id, name').eq('system_id', sys.id);
      debug.levelsChecked = allLevels?.length || 0;

      const level = allLevels?.find(l => l.name.toLowerCase().includes(classNumber || ''));
      if (!level) return { ...empty, resolvedNames: { ...empty.resolvedNames, board: sys.name } };
      debug.levelFound = true;
      debug.levelName = level.name;

      // 3. Find subject via fuzzy match
      const { data: allSubjects } = await supabase
        .from('subjects').select('id, name').eq('level_id', level.id);
      debug.subjectsChecked = allSubjects?.length || 0;

      const subject = findBestMatch(allSubjects || [], subjectSlug || '');
      if (!subject) return { ...empty, resolvedNames: { ...empty.resolvedNames, board: sys.name } };
      debug.subjectFound = true;
      debug.subjectName = subject.name;

      // 4. Find topic via fuzzy match
      const { data: allTopics } = await supabase
        .from('topics').select('id, name').eq('subject_id', subject.id);
      debug.topicsChecked = allTopics?.length || 0;

      const topic = findBestMatch(allTopics || [], topicSlug || '');
      if (topic) {
        debug.topicFound = true;
        debug.topicName = topic.name;
      }

      // 5. Related topics
      const relatedTopics = (allTopics || []).filter(t => t.id !== topic?.id).slice(0, 8);

      const resolvedNames = {
        board: sys.name, subject: subject.name,
        topic: topic?.name || topicName, subjectId: subject.id,
      };

      // 6. Fetch MCQs
      let mcqQuery = supabase
        .from('content_items')
        .select('id, title, options, correct_option, explanation, difficulty, status')
        .eq('category', 'mcq').limit(50);

      if (!isAdmin) {
        mcqQuery = mcqQuery.eq('status', 'approved');
      }

      if (topic) {
        mcqQuery = mcqQuery.eq('topic_id', topic.id);
      } else {
        mcqQuery = mcqQuery.eq('canonical_topic_name', toSlug(topicName));
      }

      const { data: mcqs } = await mcqQuery;
      debug.mcqCount = mcqs?.length || 0;

      return { mcqs: mcqs || [], relatedTopics, resolvedNames, debug };
    },
    staleTime: 5 * 60 * 1000,
  });

  const mcqs = data?.mcqs || [];
  const relatedTopics = data?.relatedTopics || [];
  const names = data?.resolvedNames || { board: boardName, subject: subjectName, topic: topicName };
  const debugInfo = data?.debug;
  const subjectId = (names as any).subjectId;

  const seoTitle = `${names.topic} MCQs - ${names.subject} Class ${classNumber} | ${names.board}`;
  const seoDesc = `Practice ${names.topic} MCQs for ${names.subject} Class ${classNumber} (${names.board}). Free online preparation with explanations.`;
  const canonicalUrl = `https://mcqsai.com/boards/${boardSlug}/class-${classNumber}/${subjectSlug}/${topicSlug}`;

  useEffect(() => {
    if (!isLoading && mcqs.length === 0 && names.topic) {
      const pagePath = `/boards/${boardSlug}/class-${classNumber}/${subjectSlug}/${topicSlug}`;
      trackEmptyTopicView({ board: names.board, subject: names.subject, topic: names.topic, classNumber: classNumber || '', url: pagePath });
      supabaseClient.from('empty_topic_analytics' as any).upsert(
        { board_name: names.board, subject_name: names.subject, topic_name: names.topic, class_number: classNumber || '', page_path: pagePath, view_count: 1, last_viewed_at: new Date().toISOString() },
        { onConflict: 'page_path' }
      ).then(({ error }) => {
        if (error) supabaseClient.rpc('increment_empty_topic_view' as any, { p_path: pagePath }).then(() => {});
      });
    }
  }, [isLoading, mcqs.length, names.topic, boardSlug, classNumber, subjectSlug, topicSlug]);

  const quizSchema = mcqs.length > 0 ? {
    '@context': 'https://schema.org', '@type': 'Quiz', name: seoTitle,
    about: { '@type': 'Thing', name: names.topic }, educationalLevel: `Class ${classNumber}`,
    numberOfQuestions: mcqs.length, provider: { '@type': 'Organization', name: 'MCQsAI', url: 'https://mcqsai.com' },
  } : null;

  return (
    <Header>
      <SEOHead title={seoTitle} description={seoDesc} keywords={`${names.topic} MCQs, ${names.subject} class ${classNumber}, ${names.board} preparation, Pakistan exam MCQs`} url={canonicalUrl} />
      {quizSchema && <Helmet><script type="application/ld+json">{JSON.stringify(quizSchema)}</script></Helmet>}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <PageBreadcrumb items={[
          { title: 'Home', href: '/' }, { title: 'Boards', href: '/boards' },
          { title: names.board, href: `/boards/${boardSlug}` },
          { title: `Class ${classNumber}`, href: `/boards/${boardSlug}/class-${classNumber}` },
          { title: names.subject, href: `/boards/${boardSlug}/class-${classNumber}/${subjectSlug}` },
          { title: names.topic, href: '#', isCurrent: true },
        ]} />

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{names.topic} MCQs</h1>
        <p className="text-muted-foreground mb-3">{names.subject} · Class {classNumber} · {names.board}</p>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : mcqs.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 space-y-4">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/40" />
            <h2 className="text-xl font-semibold text-foreground">No MCQs available for {names.topic} yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">We're working on adding questions for this topic. In the meantime, try generating a practice test with AI!</p>
            {subjectId && (
              <Link to={`/subject/${subjectId}?topic=${encodeURIComponent(names.topic)}`}>
                <Button className="mt-4 gap-2"><Sparkles className="h-4 w-4" />Generate Practice Test with AI</Button>
              </Link>
            )}

            {/* Admin Debug Panel */}
            {isAdmin && debugInfo && (
              <Collapsible className="mt-6 text-left max-w-lg mx-auto">
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline w-full justify-center">
                  <AlertTriangle className="h-4 w-4" /> Show Debug Info (Admin Only)
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm space-y-2">
                    <p className="font-semibold text-amber-800 dark:text-amber-300">Query Resolution Debug</p>
                    <div className="space-y-1 text-amber-700 dark:text-amber-400">
                      <p>Slugs: board=<code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">{debugInfo.slugsUsed.board}</code> class=<code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">{debugInfo.slugsUsed.class}</code> subject=<code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">{debugInfo.slugsUsed.subject}</code> topic=<code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">{debugInfo.slugsUsed.topic}</code></p>
                      <p>{debugInfo.systemFound ? '✅' : '❌'} System: {debugInfo.systemName || 'NOT FOUND'} ({debugInfo.systemsChecked} checked)</p>
                      <p>{debugInfo.levelFound ? '✅' : '❌'} Level: {debugInfo.levelName || 'NOT FOUND'} ({debugInfo.levelsChecked} checked)</p>
                      <p>{debugInfo.subjectFound ? '✅' : '❌'} Subject: {debugInfo.subjectName || 'NOT FOUND'} ({debugInfo.subjectsChecked} checked)</p>
                      <p>{debugInfo.topicFound ? '✅' : '❌'} Topic: {debugInfo.topicName || 'NOT FOUND'} ({debugInfo.topicsChecked} checked)</p>
                      <p>MCQs found: {debugInfo.mcqCount}</p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </motion.div>
        ) : (
          <>
            <TopicStatsBar mcqs={mcqs} />
            <TopicProgressCard topicName={names.topic} subjectName={names.subject} />
            {subjectId && <PracticeModeButtons subjectId={subjectId} topicName={names.topic} />}
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{mcqs.length} question{mcqs.length !== 1 ? 's' : ''} found</p>
              {mcqs.map((mcq, index) => {
                const options: MCQOption[] = Array.isArray(mcq.options)
                  ? (mcq.options as any[]).map((o: any) => ({ key: o.key || '', text: o.text || '' }))
                  : [];
                return (
                  <PracticeMCQCard key={mcq.id} id={mcq.id} title={`Q${index + 1}`} question={cleanQuestionText(mcq.title)} options={options} correctOption={mcq.correct_option || ''} explanation={mcq.explanation || ''} difficulty={(mcq.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Medium'} mode="practice" index={index} />
                );
              })}
            </div>
            <RelatedTopics topics={relatedTopics} boardSlug={boardSlug || ''} classNumber={classNumber || ''} subjectSlug={subjectSlug || ''} />
          </>
        )}
      </div>
      <Footer />
    </Header>
  );
};

export default BoardTopicPage;
