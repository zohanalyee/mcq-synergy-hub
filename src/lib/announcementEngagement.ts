/**
 * Guest identity + topic detection helpers for the Announcements system.
 *
 * The guest key is a random, non-personal id kept in localStorage. It lets a
 * visitor like a post once and delete their own comment without signing in.
 * No IP, email or device fingerprint is collected.
 */

const GUEST_KEY_STORAGE = 'mcqsai_engage_key';

export const getEngagementKey = (): string => {
  try {
    const existing = localStorage.getItem(GUEST_KEY_STORAGE);
    if (existing && existing.length >= 8) return existing;
    const rnd =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID().replace(/-/g, '')
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    const key = `g${rnd}`.slice(0, 40);
    localStorage.setItem(GUEST_KEY_STORAGE, key);
    return key;
  } catch {
    return `g${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  }
};

const GUEST_NAME_STORAGE = 'mcqsai_engage_name';

export const getGuestName = (): string => {
  try {
    return localStorage.getItem(GUEST_NAME_STORAGE) || '';
  } catch {
    return '';
  }
};

export const setGuestName = (name: string): void => {
  try {
    localStorage.setItem(GUEST_NAME_STORAGE, name.slice(0, 40));
  } catch {
    /* ignore */
  }
};

/* ------------------------------------------------------------------ */
/* Topic / entity detection                                            */
/* ------------------------------------------------------------------ */

export type TopicKind =
  | 'exam'
  | 'board'
  | 'province'
  | 'subject'
  | 'class'
  | 'organization'
  | 'scholarship'
  | 'career';

export interface DetectedTopic {
  topic_slug: string;
  topic_label: string;
  topic_kind: TopicKind;
}

interface TopicRule {
  slug: string;
  label: string;
  kind: TopicKind;
  patterns: RegExp[];
  /** Internal resources surfaced as "Prepare for this" links. */
  resources?: { title: string; href: string }[];
}

const MDCAT_RESOURCES = [
  { title: 'MDCAT Syllabus 2026', href: '/mdcat-syllabus' },
  { title: 'MDCAT Past Papers', href: '/mdcat-past-papers' },
  { title: 'MDCAT Exam Guide', href: '/exams/mdcat' },
  { title: 'Biology MCQs', href: '/subjects' },
  { title: 'Mock Tests', href: '/mock-tests' },
];

export const TOPIC_RULES: TopicRule[] = [
  {
    slug: 'mdcat',
    label: 'MDCAT',
    kind: 'exam',
    patterns: [/\bmdcat\b/i, /\bmcat\b/i, /medical.{0,12}(entry|admission).{0,12}test/i],
    resources: MDCAT_RESOURCES,
  },
  {
    slug: 'ecat',
    label: 'ECAT',
    kind: 'exam',
    patterns: [/\becat\b/i, /engineering.{0,12}(entry|admission).{0,12}test/i],
    resources: [
      { title: 'ECAT Preparation', href: '/exams' },
      { title: 'Physics & Maths MCQs', href: '/subjects' },
      { title: 'Mock Tests', href: '/mock-tests' },
    ],
  },
  {
    slug: 'nums',
    label: 'NUMS Entry Test',
    kind: 'exam',
    patterns: [/\bnums\b/i],
    resources: [
      { title: 'NUMS Entry Test Guide', href: '/exams/nums' },
      { title: 'Mock Tests', href: '/mock-tests' },
    ],
  },
  {
    slug: 'lat',
    label: 'LAT (Law Admission Test)',
    kind: 'exam',
    patterns: [/\blat\b/i, /law admission test/i],
    resources: [{ title: 'LAT Exam Guide', href: '/exams/lat' }],
  },
  {
    slug: 'ppsc',
    label: 'PPSC',
    kind: 'organization',
    patterns: [/\bppsc\b/i, /punjab public service commission/i],
    resources: [
      { title: 'Mock Tests', href: '/mock-tests' },
      { title: 'Question Bank', href: '/question-bank' },
      { title: 'Latest Jobs', href: '/jobs' },
    ],
  },
  {
    slug: 'spsc',
    label: 'SPSC',
    kind: 'organization',
    patterns: [/\bspsc\b/i, /sindh public service commission/i],
    resources: [
      { title: 'Mock Tests', href: '/mock-tests' },
      { title: 'Question Bank', href: '/question-bank' },
      { title: 'Latest Jobs', href: '/jobs' },
    ],
  },
  {
    slug: 'fpsc',
    label: 'FPSC',
    kind: 'organization',
    patterns: [/\bfpsc\b/i, /federal public service commission/i],
    resources: [
      { title: 'Mock Tests', href: '/mock-tests' },
      { title: 'Question Bank', href: '/question-bank' },
      { title: 'Latest Jobs', href: '/jobs' },
    ],
  },
  {
    slug: 'nts',
    label: 'NTS',
    kind: 'organization',
    patterns: [/\bnts\b/i, /national testing service/i],
    resources: [
      { title: 'Mock Tests', href: '/mock-tests' },
      { title: 'Question Bank', href: '/question-bank' },
    ],
  },
  {
    slug: 'css',
    label: 'CSS',
    kind: 'exam',
    patterns: [/\bcss\b/i, /central superior services/i],
    resources: [
      { title: 'Mock Tests', href: '/mock-tests' },
      { title: 'Study Guides', href: '/study-guides' },
    ],
  },
  {
    slug: 'sindh-high-court',
    label: 'Sindh High Court',
    kind: 'organization',
    patterns: [/sindh high court/i, /\bshc\b/i, /junior office associate/i],
    resources: [
      { title: 'Junior Office Associate BPS-13 Test', href: '/mock-tests/junior-office-associate-bps-13' },
      { title: 'Mock Tests', href: '/mock-tests' },
    ],
  },
  {
    slug: 'scholarship',
    label: 'Scholarships',
    kind: 'scholarship',
    patterns: [/scholarship/i, /wazifa/i, /financial aid/i],
    resources: [
      { title: 'All Scholarships', href: '/scholarships' },
      { title: 'Study Guides', href: '/study-guides' },
    ],
  },
  {
    slug: 'board-result',
    label: 'Board Results',
    kind: 'board',
    patterns: [/\bresult\b/i, /\bbise\b/i, /\bfbise\b/i, /board of intermediate/i],
    resources: [
      { title: 'Board Results', href: '/board-results' },
      { title: 'Boards & Classes', href: '/boards' },
    ],
  },
  {
    slug: 'sindh',
    label: 'Sindh',
    kind: 'province',
    patterns: [/\bsindh\b/i, /karachi/i, /larkana/i, /hyderabad/i, /sukkur/i],
  },
  {
    slug: 'punjab',
    label: 'Punjab',
    kind: 'province',
    patterns: [/\bpunjab\b/i, /lahore/i, /multan/i, /rawalpindi/i],
  },
  {
    slug: 'biology',
    label: 'Biology',
    kind: 'subject',
    patterns: [/\bbiology\b/i],
    resources: [{ title: 'Biology MCQs', href: '/subjects' }],
  },
  {
    slug: 'chemistry',
    label: 'Chemistry',
    kind: 'subject',
    patterns: [/\bchemistry\b/i],
    resources: [{ title: 'Chemistry MCQs', href: '/subjects' }],
  },
  {
    slug: 'physics',
    label: 'Physics',
    kind: 'subject',
    patterns: [/\bphysics\b/i],
    resources: [{ title: 'Physics MCQs', href: '/subjects' }],
  },
  {
    slug: 'english',
    label: 'English',
    kind: 'subject',
    patterns: [/\benglish\b/i],
    resources: [{ title: 'English MCQs', href: '/subjects' }],
  },
  {
    slug: 'jobs',
    label: 'Government Jobs',
    kind: 'career',
    patterns: [/\bjob\b/i, /\bvacanc/i, /\bbps-?\d+/i, /recruitment/i, /\bnaukri\b/i],
    resources: [
      { title: 'Latest Jobs', href: '/jobs' },
      { title: 'Mock Tests', href: '/mock-tests' },
    ],
  },
];

/** Detects topics from a title + body. Never invents topics that don't match. */
export const detectTopics = (title: string, body = ''): DetectedTopic[] => {
  const haystack = `${title}\n${body}`;
  const found: DetectedTopic[] = [];
  for (const rule of TOPIC_RULES) {
    if (rule.patterns.some((p) => p.test(haystack))) {
      found.push({ topic_slug: rule.slug, topic_label: rule.label, topic_kind: rule.kind });
    }
  }
  return found.slice(0, 8);
};

/** Internal resources for a set of topic slugs — only real, existing routes. */
export const resourcesForTopics = (slugs: string[], limit = 6) => {
  const out: { title: string; href: string }[] = [];
  const seen = new Set<string>();
  for (const slug of slugs) {
    const rule = TOPIC_RULES.find((r) => r.slug === slug);
    for (const res of rule?.resources ?? []) {
      if (seen.has(res.href)) continue;
      seen.add(res.href);
      out.push(res);
      if (out.length >= limit) return out;
    }
  }
  return out;
};

/* ------------------------------------------------------------------ */
/* SEO quality gate                                                    */
/* ------------------------------------------------------------------ */

export interface QualityGateResult {
  indexable: boolean;
  words: number;
  reasons: string[];
}

const PLACEHOLDER = /(lorem ipsum|test test|coming soon|tbd|placeholder|xxx)/i;

/**
 * Multi-signal gate — word count alone is never enough. A notice must have
 * real, original substance and at least one relevant internal link/topic
 * before it becomes an indexable URL.
 */
export const evaluateAnnouncementQuality = (input: {
  title: string;
  body: string;
  summary?: string | null;
  topicSlugs: string[];
}): QualityGateResult => {
  const plain = (input.body || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = plain ? plain.split(' ').length : 0;
  const reasons: string[] = [];

  if (words < 80) reasons.push('Body has fewer than 80 words of original content');
  if (!input.title || input.title.trim().length < 20)
    reasons.push('Title is too short to express clear search intent');
  if (PLACEHOLDER.test(plain)) reasons.push('Body contains placeholder text');
  if (input.topicSlugs.length === 0)
    reasons.push('No relevant topic detected, so no useful internal linking');
  if (new Set(plain.toLowerCase().split(' ')).size < 40)
    reasons.push('Content is too repetitive to stand alone in search');

  return { indexable: reasons.length === 0, words, reasons };
};
