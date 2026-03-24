/**
 * Removes admin/metadata prefixes from question text for user display
 */
export const cleanQuestionText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/^POTENTIAL DUPLICATE:\s*/i, '')
    .replace(/^DUPLICATE:\s*/i, '')
    .replace(/^\[DUPLICATE\]\s*/i, '')
    .replace(/^\[AI\]\s*/i, '')
    .replace(/^AI GENERATED:\s*/i, '')
    .trim();
};
