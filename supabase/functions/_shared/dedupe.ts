// Shared MCQ duplicate detection.
//
// Three layers, cheapest first:
//   1. exact title match
//   2. first-50-character prefix match (minor tail edits)
//   3. keyword-signature match (reworded stems with the same content words)
//
// Rows already parked as `flagged_duplicate` are ignored so a held copy never
// becomes the "original" a new question is compared against.

const STOP_WORDS = new Set([
  'what', 'which', 'when', 'where', 'who', 'how', 'does', 'the', 'and', 'for', 'are', 'but', 'not',
  'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'from',
  'they', 'will', 'would', 'there', 'their', 'that', 'this', 'with', 'could', 'into', 'than',
  'then', 'being', 'about', 'after', 'before', 'between', 'following', 'true', 'false', 'correct',
  'incorrect', 'statement', 'option',
]);

export function normalizeQuestionText(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/\[force-save-[^\]]*\]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Order-independent signature of the significant words in a question stem. */
export function questionSignature(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
    .sort()
    .slice(0, 8)
    .join('|');
}

function signatureIsUsable(sig: string): boolean {
  return !!sig && sig.split('|').length >= 3;
}

function escapeLike(value: string): string {
  return value.replace(/[%_,()]/g, ' ');
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  originalId?: string;
  originalTitle?: string;
  matchType?: 'exact' | 'prefix' | 'signature';
}

/**
 * Check a candidate question against the live MCQ library.
 * `subject` (optional) narrows the signature scan for speed.
 */
export async function checkLibraryDuplicate(
  supabase: any,
  questionText: string,
  opts: { subject?: string | null; topicId?: string | null } = {},
): Promise<DuplicateCheckResult> {
  const text = (questionText || '').trim();
  if (!text) return { isDuplicate: false };

  try {
    // 1. Exact title
    const { data: exact } = await supabase
      .from('content_items')
      .select('id, title')
      .eq('category', 'mcq')
      .neq('status', 'flagged_duplicate')
      .eq('title', text)
      .limit(1)
      .maybeSingle();
    if (exact) {
      return { isDuplicate: true, originalId: exact.id, originalTitle: exact.title, matchType: 'exact' };
    }

    // 2. Prefix
    const prefix = escapeLike(text.slice(0, 50));
    if (prefix.trim().length > 10) {
      const { data: fuzzy } = await supabase
        .from('content_items')
        .select('id, title')
        .eq('category', 'mcq')
        .neq('status', 'flagged_duplicate')
        .ilike('title', `${prefix}%`)
        .limit(1)
        .maybeSingle();
      if (fuzzy) {
        return { isDuplicate: true, originalId: fuzzy.id, originalTitle: fuzzy.title, matchType: 'prefix' };
      }
    }

    // 3. Keyword signature — catches reworded repeats
    const sig = questionSignature(text);
    if (!signatureIsUsable(sig)) return { isDuplicate: false };

    const keywords = sig.split('|').slice(0, 3).filter((k) => k.length > 3);
    if (keywords.length === 0) return { isDuplicate: false };

    // Library-wide on purpose: the same question is often re-saved under a
    // different subject/topic label, so narrowing by tag would miss cross-tag
    // rewordings. The keyword filters + row cap keep this cheap.
    let query = supabase
      .from('content_items')
      .select('id, title')
      .eq('category', 'mcq')
      .neq('status', 'flagged_duplicate');

    for (const kw of keywords) {
      query = query.ilike('title', `%${escapeLike(kw)}%`);
    }

    const { data: candidates } = await query.limit(80);
    for (const row of candidates || []) {
      if (questionSignature(row.title || '') === sig) {
        return { isDuplicate: true, originalId: row.id, originalTitle: row.title, matchType: 'signature' };
      }
    }

    return { isDuplicate: false };
  } catch (err) {
    console.error('[dedupe] duplicate check failed:', err);
    return { isDuplicate: false };
  }
}
