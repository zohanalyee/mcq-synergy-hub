// Build-time mirror of src/lib/mockTestNetwork.ts — keep both files in sync.
// Used by scripts/inject-meta.mjs so the raw (non-JS) HTML crawlers fetch
// carries the same exact-match phrases as the hydrated page.

export const IBA_NETWORK_LABEL = 'Sukkur IBA Community Colleges & Schools';

const TEACHING_CADRE =
  /\b(ece|est|sst|hst|pst|jst|subject specialist|educator|instructor|teacher|lecturer|principal|headmaster)\b/i;

const SCHOOL_CADRE =
  /\b(ece|est|sst|hst|pst|jst|subject specialist|educator|instructor|teacher|lecturer|principal|headmaster|lab assistant|library assistant|laboratory|physical training|drawing|computer operator|school)\b/i;

export function isIbaCommunityNetwork(organization, title) {
  const org = String(organization || '');
  if (!/sukkur\s*iba|siba testing/i.test(org)) return false;
  if (/court|judge|steda|pmdc|medical|health|police|revenue|investigation/i.test(`${org} ${title || ''}`)) {
    return false;
  }
  return SCHOOL_CADRE.test(String(title || ''));
}

export function cleanTestTitle(title) {
  return String(title || '')
    .replace(/\s*mock test\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function withTeacher(clean) {
  if (!TEACHING_CADRE.test(clean)) return clean;
  if (/teacher|lecturer|principal|headmaster|specialist|educator|instructor/i.test(clean)) return clean;
  const paren = clean.match(/^(.*?)(\s*\([^)]*\))\s*$/);
  if (paren) return `${paren[1].trim()} Teacher${paren[2]}`;
  return `${clean} Teacher`;
}

function shortenTitle(clean, budget) {
  let out = clean.slice(0, budget);
  const lastSpace = out.lastIndexOf(' ');
  if (lastSpace > budget * 0.5) out = out.slice(0, lastSpace);
  const open = out.lastIndexOf('(');
  if (open > -1 && out.indexOf(')', open) === -1) out = out.slice(0, open);
  return out.replace(/[\s\-–—,(/]+$/, '').trim();
}

export function buildIbaMetaTitle(title) {
  const base = cleanTestTitle(title).replace(/\s*[-–—]\s*(siba|sukkur\s*iba|sts)\b.*$/i, '').trim();
  const clean = withTeacher(base || cleanTestTitle(title));
  const suffixes = [
    `Syllabus & Mock Test — ${IBA_NETWORK_LABEL}`,
    'Syllabus & Mock Test — IBA Community Colleges (STS)',
    'Syllabus & Past Papers — IBA Community Colleges',
    'Syllabus & Mock Test — IBA Community Colleges',
    'Syllabus — IBA Community Colleges (STS)',
    'Syllabus — IBA Community Colleges',
  ];
  for (const suffix of suffixes) {
    const candidate = `${clean} ${suffix}`;
    if (candidate.length <= 65) return candidate;
  }
  const tail = '— IBA Community Colleges';
  const budget = 65 - tail.length - 1;
  const short = clean.length <= budget ? clean : shortenTitle(clean, budget);
  return `${short} ${tail}`;
}

export function buildIbaMetaDescription(title, questions, subjects = []) {
  const clean = withTeacher(cleanTestTitle(title));
  const topTwo = subjects.slice(0, 2).join(' and ');
  const parts = [
    `${clean} syllabus, paper pattern and past papers for the ${IBA_NETWORK_LABEL} (STS) test.`,
    `Free online mock test: ${questions || 100} MCQs${topTwo ? ` on ${topTwo}` : ''} with full subject weightage.`,
    'Start practising free.',
  ];
  const full = parts.join(' ');
  if (full.length <= 298) return full;
  return `${parts[0]} Free online mock test with ${questions || 100} MCQs and full subject weightage.`;
}

export function buildIbaKeywords(title, stored = []) {
  const clean = cleanTestTitle(title).toLowerCase();
  const extra = [
    'iba community colleges',
    'sukkur iba community colleges and schools',
    'iba community colleges and schools jobs test',
    'sukkur iba community colleges syllabus',
    'iba community colleges past papers',
    'sts iba community colleges test',
    clean && `${clean} iba community colleges syllabus`,
    clean && `${clean} iba community colleges and schools past papers`,
    clean && `${clean} teacher syllabus iba community colleges`,
  ].filter(Boolean);

  const seen = new Set();
  const out = [];
  for (const k of [...extra, ...(stored || [])]) {
    const key = String(k || '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}
