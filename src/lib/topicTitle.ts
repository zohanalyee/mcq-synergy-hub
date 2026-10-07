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
// Hand-picked short topic names for titles that would otherwise be cut
// mid-word. Keyed by lowercased topic name. Mirror in scripts/topic-content.mjs.
const TOPIC_TITLE_OVERRIDES: Record<string, string> = {
  'stoichiometry advanced calculations': 'Stoichiometry Calculations',
};

export function buildTopicTitleBase(
  topic: string,
  subject: string,
  classN: string | number,
): string {
  const MAX = 51; // 51 + " | MCQsAI" (9) = 60
  const tail = ` MCQs - Class ${classN} ${subject}`;
  const override = TOPIC_TITLE_OVERRIDES[String(topic).trim().toLowerCase()];
  if (override) return `${override}${tail}`;
  let base = `${topic}${tail}`;
  if (base.length > MAX) {
    const available = MAX - tail.length;
    const t = available > 1 ? `${topic.slice(0, available - 1).trimEnd()}…` : '';
    base = `${t}${tail}`.slice(0, MAX);
  }
  return base;
}
