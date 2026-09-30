/**
 * Exam-network SEO helpers for /mock-tests/<slug> pages.
 *
 * WHY: candidates search the exact phrase printed on their advertisement and
 * roll-number slip — "Sukkur IBA Community Colleges & Schools" — but the stored
 * job title ("ECE (Female)") never contains it, so those queries never matched.
 *
 * These helpers derive the official network label from the stored organisation
 * string ONLY (never invented) and produce:
 *   - a Google-safe meta title (<= 65 chars so it is not truncated in the SERP)
 *   - a description whose first sentence carries the exact phrase
 *   - extra exact-match keywords
 *   - a short visible badge, so the on-page H1 stays short on mobile
 *
 * Mirrored for the build-time raw-HTML injector in scripts/mock-test-network.mjs
 * — keep both files in sync.
 */

export const IBA_NETWORK_LABEL = "Sukkur IBA Community Colleges & Schools";

/** Cadres whose candidates search with the word "Teacher" attached. */
const TEACHING_CADRE =
  /\b(ece|est|sst|hst|pst|jst|subject specialist|educator|instructor|teacher|lecturer|principal|headmaster)\b/i;

/**
 * True only for the school/college teaching network run by Sukkur IBA.
 * STS also conducts High Court, STEDA licensing and medical (PMDC) tests —
 * those are deliberately excluded so no page claims the wrong institution.
 */
export function isIbaCommunityNetwork(organization?: string | null, title?: string | null): boolean {
  const org = String(organization || "");
  if (!/sukkur\s*iba|siba testing/i.test(org)) return false;
  if (/court|judge|steda|pmdc|medical|health|police|revenue|investigation/i.test(`${org} ${title || ""}`)) {
    return false;
  }
  // Only posts that belong to the schools/colleges cadre carry the network name,
  // so no page claims an institution the advertisement did not name.
  return SCHOOL_CADRE.test(String(title || ""));
}

/** Strips the "Mock Test" suffix candidates never type into Google. */
export function cleanTestTitle(title?: string | null): string {
  return String(title || "")
    .replace(/\s*mock test\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function withTeacher(clean: string): string {
  if (!TEACHING_CADRE.test(clean)) return clean;
  if (/teacher|lecturer|principal|headmaster|specialist|educator|instructor/i.test(clean)) return clean;
  // "ECE (Female)" -> "ECE Teacher (Female)" so the phrase reads naturally.
  const paren = clean.match(/^(.*?)(\s*\([^)]*\))\s*$/);
  if (paren) return `${paren[1].trim()} Teacher${paren[2]}`;
  return `${clean} Teacher`;
}

/** Cuts on a word boundary and never leaves a half-open bracket behind. */
function shortenTitle(clean: string, budget: number): string {
  let out = clean.slice(0, budget);
  const lastSpace = out.lastIndexOf(" ");
  if (lastSpace > budget * 0.5) out = out.slice(0, lastSpace);
  const open = out.lastIndexOf("(");
  if (open > -1 && out.indexOf(")", open) === -1) out = out.slice(0, open);
  return out.replace(/[\s\-–—,(/]+$/, "").trim();
}

/**
 * Meta title for an IBA Community Colleges & Schools test. Picks the most
 * descriptive variant that still fits Google's ~65-character display window.
 */
export function buildIbaMetaTitle(title?: string | null): string {
  // The network name is already in the suffix, so a trailing "- SIBA Testing
  // Services (STS)" inside the job title only wastes the 65-character window.
  const base = cleanTestTitle(title).replace(/\s*[-–—]\s*(siba|sukkur\s*iba|sts)\b.*$/i, "").trim();
  const clean = withTeacher(base || cleanTestTitle(title));
  const suffixes = [
    `Syllabus & Mock Test — ${IBA_NETWORK_LABEL}`,
    "Syllabus & Mock Test — IBA Community Colleges (STS)",
    "Syllabus & Past Papers — IBA Community Colleges",
    "Syllabus & Mock Test — IBA Community Colleges",
    "Syllabus — IBA Community Colleges (STS)",
    "Syllabus — IBA Community Colleges",
  ];
  for (const suffix of suffixes) {
    const candidate = `${clean} ${suffix}`;
    if (candidate.length <= 65) return candidate;
  }
  // Long job titles: keep the exact network phrase and shorten the job title,
  // never the other way round.
  const tail = "— IBA Community Colleges";
  const budget = 65 - tail.length - 1;
  const short = clean.length <= budget ? clean : shortenTitle(clean, budget);
  return `${short} ${tail}`;
}

export function buildIbaMetaDescription(
  title?: string | null,
  questions?: number | null,
  subjects: string[] = [],
): string {
  const clean = withTeacher(cleanTestTitle(title));
  const topTwo = subjects.slice(0, 2).join(" and ");
  const parts = [
    `${clean} syllabus, paper pattern and past papers for the ${IBA_NETWORK_LABEL} (STS) test.`,
    `Free online mock test: ${questions || 100} MCQs${topTwo ? ` on ${topTwo}` : ""} with full subject weightage.`,
    "Start practising free.",
  ];
  const full = parts.join(" ");
  if (full.length <= 298) return full;
  return `${parts[0]} Free online mock test with ${questions || 100} MCQs and full subject weightage.`;
}

/** Exact-match phrases candidates actually type, merged with stored keywords. */
export function buildIbaKeywords(title?: string | null, stored: string[] = []): string[] {
  const clean = cleanTestTitle(title).toLowerCase();
  const extra = [
    "iba community colleges",
    "sukkur iba community colleges and schools",
    "iba community colleges and schools jobs test",
    "sukkur iba community colleges syllabus",
    "iba community colleges past papers",
    "sts iba community colleges test",
    clean && `${clean} iba community colleges syllabus`,
    clean && `${clean} iba community colleges and schools past papers`,
    clean && `${clean} teacher syllabus iba community colleges`,
  ].filter(Boolean) as string[];

  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of [...extra, ...stored]) {
    const key = String(k || "").trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

/** Short label shown as a badge above the H1 (keeps the heading mobile-friendly). */
export function ibaBadgeLabel(): string {
  return IBA_NETWORK_LABEL;
}
