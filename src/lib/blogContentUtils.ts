/**
 * Blog content post-processing helpers:
 *  - calculateReadingTime: ~225 wpm fallback when AI did not supply one
 *  - autoLinkMarkdown: smart internal linker (max N keywords) using catalogue
 *  - extractHowToSteps: parse ordered steps from markdown for HowTo schema
 *
 * All operations are pure and run client-side at render time.
 */
import CATALOGUE, { type CatalogueEntry } from "./blogLinkCatalogue";

/* ----------------- Reading time ----------------- */
export function calculateReadingTime(markdown: string | null | undefined): number {
  if (!markdown) return 0;
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[#>*_~|-]/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 225));
}

/* ----------------- Auto internal linker ----------------- */
function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface Keyword { anchor: string; href: string }

function buildKeywordIndex(category: string | null | undefined): Keyword[] {
  const seen = new Set<string>();
  const ordered: Keyword[] = [];
  const cat = (category || "general").toLowerCase().trim();
  const primary: CatalogueEntry[] = CATALOGUE[cat] ?? [];
  const all: CatalogueEntry[] = [
    ...primary,
    ...Object.entries(CATALOGUE)
      .filter(([k]) => k !== cat)
      .flatMap(([, v]) => v),
  ];
  for (const entry of all) {
    const key = entry.anchor.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    ordered.push({ anchor: entry.anchor, href: entry.href });
  }
  return ordered;
}

/**
 * Auto-link high-value keywords in markdown body. Skips headings, fenced code,
 * tables, blockquotes, and any text already inside a link. Hard caps at `max`
 * total replacements (default 6) and at most ONE replacement per keyword.
 */
export function autoLinkMarkdown(
  markdown: string,
  category: string | null | undefined,
  max = 6,
): string {
  if (!markdown) return markdown;
  const keywords = buildKeywordIndex(category);
  if (!keywords.length) return markdown;

  // Split into lines, preserving fenced code blocks unchanged
  const lines = markdown.split("\n");
  let inFence = false;
  let used = 0;
  const usedKeywords = new Set<string>();

  for (let i = 0; i < lines.length && used < max; i++) {
    const line = lines[i];
    if (/^\s*```/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    if (/^\s*#/.test(line)) continue;          // headings
    if (/^\s*\|/.test(line)) continue;         // table rows
    if (/^\s*>/.test(line)) continue;          // blockquotes
    if (!line.trim()) continue;

    for (const kw of keywords) {
      if (used >= max) break;
      if (usedKeywords.has(kw.anchor)) continue;

      // Skip if line already has a markdown link to this href OR an existing link wrapping the anchor
      if (line.includes(`](${kw.href})`)) { usedKeywords.add(kw.anchor); continue; }

      const re = new RegExp(`(?<![\\[\\w])(${escapeRegex(kw.anchor)})(?![\\w\\]])`, "i");
      // Ensure match isn't already inside a [..](..) link
      const match = re.exec(line);
      if (!match) continue;
      const idx = match.index;
      // Quick check: count unbalanced [ before idx
      const before = line.slice(0, idx);
      const openBrackets = (before.match(/\[/g) || []).length;
      const closeBrackets = (before.match(/]/g) || []).length;
      if (openBrackets > closeBrackets) continue; // inside a link text

      lines[i] =
        line.slice(0, idx) +
        `[${match[1]}](${kw.href})` +
        line.slice(idx + match[1].length);
      usedKeywords.add(kw.anchor);
      used++;
      break; // one link per line to avoid clustering
    }
  }

  return lines.join("\n");
}

/* ----------------- HowTo step extractor ----------------- */
export interface HowToStep { name: string; text: string }

/**
 * Extract ordered steps from markdown for HowTo schema.
 * Recognises:
 *   - "## Step 1: Title" / "### Step 1 — Title" style headings
 *   - "1. Title" / "1) Title" numbered list items at the start of a line
 * Returns up to 12 steps, each with a short name + accompanying paragraph.
 */
export function extractHowToSteps(markdown: string | null | undefined): HowToStep[] {
  if (!markdown) return [];
  const steps: HowToStep[] = [];

  // Pattern 1: "## Step N: Title" then body until next heading
  const stepHeadingRe = /^#{2,3}\s+Step\s+\d+/i;
  const lines = markdown.split("\n");

  for (let i = 0; i < lines.length; i++) {
    if (stepHeadingRe.test(lines[i])) {
      const name = lines[i].replace(/^#{2,3}\s+/, "").replace(/^Step\s+\d+\s*[:.\\-—]?\s*/i, "").trim();
      const body: string[] = [];
      for (let j = i + 1; j < lines.length; j++) {
        if (/^#{2,3}\s+/.test(lines[j])) break;
        body.push(lines[j]);
      }
      const text = body.join(" ").replace(/\s+/g, " ").trim().slice(0, 320);
      if (name) steps.push({ name, text: text || name });
    }
  }
  if (steps.length >= 2) return steps.slice(0, 12);

  // Pattern 2: numbered list items "1. ..." / "1) ..."
  const numberedRe = /^\s*(\d+)[.)]\s+(.+)$/;
  for (const line of lines) {
    const m = line.match(numberedRe);
    if (m) {
      const raw = m[2].trim();
      const [namePart, ...rest] = raw.split(/[:—\-]\s+/);
      const name = (namePart || raw).slice(0, 90);
      const text = (rest.join(" — ") || raw).slice(0, 320);
      steps.push({ name, text });
    }
  }
  return steps.slice(0, 12);
}

/* ----------------- Helpers exposed for tests ----------------- */
export const __test = { buildKeywordIndex };
