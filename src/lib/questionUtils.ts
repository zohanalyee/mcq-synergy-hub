/**
 * Removes admin/metadata prefixes from question text for user display.
 * Belt-and-braces guard: even if a debug tag ever leaks into the DB again,
 * learners never see it.
 */
export const cleanQuestionText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/^\s*\[POTENTIAL DUPLICATE\]\s*/i, '')
    .replace(/^\s*POTENTIAL DUPLICATE:\s*/i, '')
    .replace(/^\s*\[DUPLICATE\]\s*/i, '')
    .replace(/^\s*DUPLICATE:\s*/i, '')
    .replace(/^\s*\[ERROR\/DUPLICATE-[a-z0-9]+\]\s*/i, '')
    .replace(/^\s*\[AI\]\s*/i, '')
    .replace(/^\s*AI GENERATED:\s*/i, '')
    .trim();
};
