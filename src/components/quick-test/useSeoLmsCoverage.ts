import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toSlug } from "@/lib/slugUtils";
import { SeoLmsContext } from "@/data/seoLmsMapping";

/**
 * Resolved deep-link target for a single SEO topic chip. Built purely from
 * EXISTING LMS records — never creates new topics/MCQs.
 */
export interface ResolvedTopic {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  mcqCount: number;
  /** Practice mode (board topic page with approved MCQs). */
  practicePath: string;
  /** Reading mode (subject content reader scoped to the topic). */
  readingPath: string;
  /** Subject overview page. */
  subjectPath: string;
}

interface TopicRow {
  topicName: string;
  topicId: string;
  subjectId: string;
  subjectName: string;
  mcqCount: number;
}

/**
 * Loads every topic (with approved-MCQ counts) for the LMS level a given SEO
 * page maps to, in a single batched query, then exposes a slug-based resolver
 * so chips can deep-link into existing content.
 *
 * Returns a no-op resolver when the page has no LMS mapping, so SEO pages
 * without existing coverage keep their current Quick Test behaviour.
 */
export const useSeoLmsCoverage = (ctx: SeoLmsContext | null) => {
  const { data } = useQuery({
    queryKey: ["seo-lms-coverage", ctx?.systemName, ctx?.levelName],
    enabled: !!ctx,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<TopicRow[]> => {
      if (!ctx) return [];

      // 1. Resolve system + level (existing records only).
      const { data: systems } = await supabase
        .from("educational_systems")
        .select("id, name")
        .ilike("name", `%${ctx.systemName}%`)
        .limit(1);
      const systemId = systems?.[0]?.id;
      if (!systemId) return [];

      const { data: levels } = await supabase
        .from("levels")
        .select("id, name")
        .eq("system_id", systemId)
        .eq("name", ctx.levelName)
        .limit(1);
      const levelId = levels?.[0]?.id;
      if (!levelId) return [];

      // 2. Subjects + topics for the level.
      const { data: subjects } = await supabase
        .from("subjects")
        .select("id, name")
        .eq("level_id", levelId);
      if (!subjects?.length) return [];

      const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
      const { data: topics } = await supabase
        .from("topics")
        .select("id, name, subject_id")
        .in(
          "subject_id",
          subjects.map((s) => s.id)
        );
      if (!topics?.length) return [];

      // 3. Approved MCQ counts per topic_id (single query).
      const { data: mcqs } = await supabase
        .from("content_items")
        .select("topic_id")
        .eq("category", "mcq")
        .eq("status", "approved")
        .in(
          "topic_id",
          topics.map((t) => t.id)
        );

      const counts = new Map<string, number>();
      (mcqs || []).forEach((m: any) => {
        if (m.topic_id) counts.set(m.topic_id, (counts.get(m.topic_id) || 0) + 1);
      });

      return topics.map((t) => ({
        topicName: t.name,
        topicId: t.id,
        subjectId: t.subject_id,
        subjectName: subjectMap.get(t.subject_id) || "",
        mcqCount: counts.get(t.id) || 0,
      }));
    },
  });

  const rows = data || [];
  const bySlug = new Map(rows.map((r) => [toSlug(r.topicName), r]));

  /** Resolve an SEO chip topic name to an existing LMS topic deep link. */
  const resolve = (topicName: string): ResolvedTopic | null => {
    if (!ctx) return null;
    const slug = toSlug(topicName);
    const row =
      bySlug.get(slug) ||
      rows.find((r) => {
        const rs = toSlug(r.topicName);
        return rs.includes(slug) || slug.includes(rs);
      });
    if (!row) return null;

    const boardSlug = toSlug(ctx.systemName);
    const subjectSlug = toSlug(row.subjectName);
    const topicSlug = toSlug(row.topicName);
    return {
      topicId: row.topicId,
      topicName: row.topicName,
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      mcqCount: row.mcqCount,
      practicePath: `/boards/${boardSlug}/${ctx.classNumber}/${subjectSlug}/${topicSlug}`,
      readingPath: `/subject/${row.subjectId}?topic=${encodeURIComponent(row.topicName)}`,
      subjectPath: `/boards/${boardSlug}/${ctx.classNumber}/${subjectSlug}`,
    };
  };

  return { resolve, isReady: !!ctx, rows };
};
