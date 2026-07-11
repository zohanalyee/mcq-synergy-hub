/**
 * Build the topic <title> BASE (without the " | MCQsAI" suffix that SEOHead
 * appends). Board name is intentionally excluded to keep the final title
 * <= 60 chars (the board still appears in the description, H1 context,
 * breadcrumb, and canonical). A truncation safeguard trims the topic portion
 * for long topic/subject names.
 *
 * MUST stay identical to buildTopicTitleBase in scripts/topic-content.mjs so
 * the JS-rendered <title> matches the prerendered raw HTML (no cloaking).
 */
export function buildTopicTitleBase(
  topic: string,
  subject: string,
  classN: string | number,
): string {
  const MAX = 51; // 51 + " | MCQsAI" (9) = 60
  const tail = ` MCQs - Class ${classN} ${subject}`;
  let base = `${topic}${tail}`;
  if (base.length > MAX) {
    const available = MAX - tail.length;
    const t = available > 1 ? `${topic.slice(0, available - 1).trimEnd()}…` : '';
    base = `${t}${tail}`.slice(0, MAX);
  }
  return base;
}
