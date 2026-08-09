/**
 * Helpers for showing AI/admin-authored markdown safely in compact UI slots
 * (cards, tooltips, meta descriptions) where a full markdown renderer would
 * break the layout.
 */

/** Convert markdown to a single-line, human-readable plain-text summary. */
export function stripMarkdown(input: string | null | undefined): string {
  if (!input) return '';
  return input
    // fenced/inline code
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    // images then links -> keep label
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // headings, blockquotes, list bullets
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // horizontal rules & tables pipes
    .replace(/^\s*([-*_]\s*){3,}$/gm, ' ')
    .replace(/\|/g, ' ')
    // emphasis
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    // whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/** Plain-text summary trimmed to a max length with an ellipsis. */
export function markdownExcerpt(
  input: string | null | undefined,
  maxLength = 180
): string {
  const text = stripMarkdown(input);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}
