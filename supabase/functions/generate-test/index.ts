import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkQuota, retryWithBackoff, quotaExhaustedResponse, QuotaExhaustedError } from '../_shared/quotaManager.ts';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Convert DB options (object {A:"...",B:"..."} or array) to array, and resolve answer letter to text
function normalizeDbQuestion(q: any): Question {
  let optionsArray: string[];
  let answerText: string = q.correct_option || '';

  if (Array.isArray(q.options)) {
    optionsArray = q.options;
  } else if (q.options && typeof q.options === 'object') {
    const keys = ['A', 'B', 'C', 'D'];
    optionsArray = keys.map(k => q.options[k]).filter(Boolean);
    // Resolve letter answer to full text
    if (answerText && q.options[answerText]) {
      answerText = q.options[answerText];
    }
  } else {
    optionsArray = [];
  }

  return {
    id: q.id,
    question: q.title,
    options: optionsArray,
    answer: answerText,
    explanation: q.explanation || undefined,
    subject: q.subject || q.topic || 'General',
    topic: q.topic || q.subject || 'General',
    difficulty: q.difficulty || undefined
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Question {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
  id?: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
}

interface UsageLogEntry {
  triggered_by_user_id?: string;
  source_type: 'user_test_session' | 'admin_bulk_generator' | 'auto_fill';
  subject?: string;
  topic?: string;
  difficulty?: string;
  questions_requested: number;
  questions_fetched: number;
  questions_saved: number;
  metadata?: Record<string, any>;
}

import { callAIWithAutoSwitch } from '../_shared/gemini.ts';

// Wrapper to maintain existing call pattern - now uses auto-switcher
async function callGeminiForBatch(
  _apiKey: string,
  promptText: string,
  generationConfig: any
): Promise<{ success: boolean; text?: string; modelUsed?: string; error?: string; status?: number; provider?: string; cost?: number }> {
  console.log('🔄 Calling AI with auto-switch...');
  try {
    const { text, provider, cost } = await callAIWithAutoSwitch('', promptText, {
      temperature: generationConfig?.temperature || 0.7,
      maxOutputTokens: generationConfig?.maxOutputTokens || 8000,
    }, { supabaseClient: null, sourceType: 'generate-test' });
    console.log(`✅ Success with ${provider} (cost: ${cost})`);
    return { success: true, text, modelUsed: provider === 'gemini' ? 'gemini-2.0-flash' : 'lovable-gateway', provider, cost };
  } catch (err: any) {
    const msg = err.message || '';
    if (msg.includes('CREDITS_EXHAUSTED') || msg.includes('402')) {
      return { success: false, error: 'CREDITS_EXHAUSTED', status: 402 };
    }
    if (msg.includes('RATE_LIMIT') || msg.includes('429') || msg.includes('quota')) {
      return { success: false, error: 'ALL_MODELS_FAILED', status: 429 };
    }
    if (msg.includes('AUTH_ERROR')) {
      return { success: false, error: 'AUTH_ERROR', status: 403 };
    }
    console.error('❌ AI auto-switch error:', msg);
    return { success: false, error: 'ALL_MODELS_FAILED', status: 500 };
  }
}


// Sanitize topic for flexible matching - removes brackets and extra whitespace
function sanitizeTopic(topic: string): string {
  return topic.replace(/\s*\([^)]*\)\s*/g, '').trim();
}

// Escape special chars that break PostgREST .or() parsing
function escapePostgrestValue(value: string): string {
  return value
    .replace(/[(),;:*%]/g, ' ')  // Remove PostgREST special chars and wildcards
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);  // Enforce length limit
}

// Extract meaningful keywords from a compound topic string
function extractKeywords(topic: string): string[] {
  const escaped = escapePostgrestValue(topic);
  const words = escaped.split(' ').filter(w => w.length > 2);
  const unique = [...new Set(words)].slice(0, 5);
  return unique;
}

// ============= HYBRID DEDUPLICATION SYSTEM =============

// Generate a semantic fingerprint for duplicate detection
// Extracts key content words, sorts them for order-independent matching
function generateQuestionFingerprint(questionText: string): string {
  const stopWords = new Set(['what', 'which', 'when', 'where', 'who', 'how', 'does', 'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'from', 'they', 'will', 'would', 'there', 'their', 'that', 'this', 'with', 'could', 'into', 'than', 'then', 'being', 'about', 'after', 'before', 'between', 'following', 'true', 'false', 'correct', 'incorrect', 'statement', 'option']);
  
  return questionText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word)) // Keep significant words
    .sort() // Sort for order-independent matching
    .slice(0, 8) // Take top 8 keywords
    .join('|');
}

// Check if a question is semantically similar to existing fingerprints
function isDuplicateByFingerprint(questionText: string, existingFingerprints: Set<string>): boolean {
  const newFingerprint = generateQuestionFingerprint(questionText);
  if (!newFingerprint || newFingerprint.split('|').length < 3) {
    return false; // Too short to reliably fingerprint
  }
  return existingFingerprints.has(newFingerprint);
}

// Normalize question text for comparison (handles minor variations)
function normalizeQuestionText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// The content_items.difficulty CHECK constraint only allows 'Easy' | 'Medium' | 'Hard'.
// The request difficulty can be 'mixed' (Content Health / bulk fills) or arbitrary text,
// which would violate the constraint and silently fail every insert. Normalize to a
// valid value: prefer the request difficulty, then the generated question's own
// difficulty, otherwise default to 'Medium'.
function toValidDifficulty(
  requestDifficulty?: string | null,
  questionDifficulty?: string | null,
): 'Easy' | 'Medium' | 'Hard' {
  const coerce = (v?: string | null): 'Easy' | 'Medium' | 'Hard' | null => {
    if (!v) return null;
    const norm = v.trim().toLowerCase();
    if (norm === 'easy') return 'Easy';
    if (norm === 'medium') return 'Medium';
    if (norm === 'hard') return 'Hard';
    return null; // 'mixed' and anything else is invalid for the constraint
  };
  return coerce(requestDifficulty) || coerce(questionDifficulty) || 'Medium';
}

function enrichQuestionsForSession(
  questions: Question[],
  topic: string,
  sanitizedTopic: string,
  difficulty?: string,
): Question[] {
  const normalizedDifficulty = difficulty
    ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase()
    : undefined;

  return questions.map((q) => ({
    ...q,
    subject: q.subject || sanitizedTopic || topic || 'General',
    topic: q.topic || topic || sanitizedTopic || 'General',
    difficulty: q.difficulty || normalizedDifficulty,
  }));
}

async function syncQuestionsToSession(
  supabase: any,
  sessionId: string | undefined,
  questions: Question[],
): Promise<void> {
  if (!sessionId || typeof sessionId !== 'string' || questions.length === 0) return;

  try {
    const { data: existingSession, error: fetchError } = await supabase
      .from('custom_test_sessions')
      .select('questions')
      .eq('id', sessionId)
      .single();

    if (fetchError) throw fetchError;

    const existingQuestions = Array.isArray(existingSession?.questions) ? existingSession.questions : [];
    const existingTexts = new Set(
      existingQuestions
        .map((q: any) => normalizeQuestionText(q.question || q.title || ''))
        .filter(Boolean)
    );

    const newForSession = questions.filter((q) => {
      const normalizedText = normalizeQuestionText(q.question || '');
      return normalizedText && !existingTexts.has(normalizedText);
    });

    if (newForSession.length === 0 && existingQuestions.length > 0) return;

    const mergedQuestions = existingQuestions.length === 0
      ? questions
      : [...existingQuestions, ...newForSession];

    const { error: updateError } = await supabase
      .from('custom_test_sessions')
      .update({ questions: mergedQuestions })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    console.log(`📝 Synced session ${sessionId}: added ${newForSession.length} questions (total: ${mergedQuestions.length})`);
  } catch (sessionErr) {
    console.error('Failed to sync questions to session:', sessionErr);
  }

  // Freshness rotation: record usage for served DB-origin questions (real UUID ids).
  // Fire-and-forget; never blocks the serving path.
  await recordServedUsage(supabase, questions);
}

// Phase 5 freshness rotation — bump usage_count/last_used_at for any served
// question that originated from content_items (has a UUID id). Generated-but-
// not-yet-persisted questions have no id and are skipped.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function recordServedUsage(supabase: any, questions: any[]): Promise<void> {
  try {
    const ids = Array.from(new Set(
      (questions || [])
        .map((q) => (typeof q?.id === 'string' ? q.id : null))
        .filter((id): id is string => !!id && UUID_RE.test(id))
    ));
    if (ids.length === 0) return;
    const { error } = await supabase.rpc('record_question_usage', { question_ids: ids });
    if (error) {
      console.warn('record_question_usage failed (non-fatal):', error.message);
      return;
    }
    console.log(`🔄 Freshness: recorded usage for ${ids.length} served questions`);
  } catch (e) {
    console.warn('recordServedUsage error (non-fatal):', (e as any)?.message);
  }
}

// Map job tests to their core syllabus subjects for cross-question reuse
const JOB_SYLLABUS_MAP: Record<string, string[]> = {
  "Banking Officer": ["English", "Economics", "Finance", "Quantitative", "IT", "Pakistan Affairs", "Current Affairs"],
  "OG-2": ["English", "Economics", "Finance", "Quantitative", "IT", "Pakistan Affairs", "Current Affairs"],
  "OG-3": ["English", "Economics", "Finance", "Quantitative", "IT", "Pakistan Affairs", "Current Affairs"],
  "Civil Judge": ["Civil Law", "Criminal Law", "Constitutional Law", "English", "Islamic Law", "Pakistan Affairs"],
  "Election Officer": ["English", "Constitution", "Election Act", "Islamiyat", "Pakistan Affairs", "General Knowledge"],
  "Assistant Director": ["English", "General Knowledge", "Pakistan Affairs", "Islamic Studies", "Reasoning", "Current Affairs"],
  "Lecturer": ["English", "General Knowledge", "Pakistan Affairs", "Islamic Studies", "Education"],
  "Physics Lecturer": ["Physics", "English", "General Knowledge", "Education", "Mechanics", "Optics"],
  "Chemistry Lecturer": ["Chemistry", "English", "General Knowledge", "Education", "Organic Chemistry"],
  "Biology Lecturer": ["Biology", "English", "General Knowledge", "Education", "Botany", "Zoology"],
  "English Lecturer": ["English", "English Literature", "Grammar", "Education", "Literature Analysis"],
  "Math Lecturer": ["Mathematics", "English", "General Knowledge", "Education", "Algebra", "Calculus"],
  "Computer Lecturer": ["Computer Science", "IT", "English", "Education", "Programming"],
  "PMS": ["English", "Pakistan Affairs", "Current Affairs", "Islamic Studies", "General Knowledge", "Essay Writing"],
  "CSS": ["English", "Pakistan Affairs", "Current Affairs", "Islamic Studies", "General Knowledge", "Essay Writing"],
  "PPSC": ["English", "Pakistan Affairs", "General Knowledge", "Islamic Studies", "Current Affairs"],
  "FPSC": ["English", "Pakistan Affairs", "General Knowledge", "Islamic Studies", "Current Affairs"],
  "NTS": ["English", "Quantitative", "Analytical", "General Knowledge"],
  "ECAT": ["Physics", "Chemistry", "Mathematics", "English"],
  "MDCAT": ["Biology", "Chemistry", "Physics", "English"],
  "GAT": ["English", "Quantitative", "Analytical"],
};

// Get syllabus subjects for a job/test topic
function getSyllabusSubjects(topic: string): string[] {
  const sanitized = sanitizeTopic(topic).toLowerCase();
  
  for (const [jobKey, subjects] of Object.entries(JOB_SYLLABUS_MAP)) {
    if (sanitized.includes(jobKey.toLowerCase()) || jobKey.toLowerCase().includes(sanitized)) {
      return subjects;
    }
  }
  
  for (const [jobKey, subjects] of Object.entries(JOB_SYLLABUS_MAP)) {
    if (topic.toLowerCase().includes(jobKey.toLowerCase())) {
      return subjects;
    }
  }
  
  return [];
}

// Build broader search conditions for syllabus-aware matching
function buildSyllabusSearchConditions(topic: string, sanitizedTopic: string, syllabusSubjects: string[]): string {
  const conditions: string[] = [];
  
  const topicKeywords = extractKeywords(sanitizedTopic);
  
  for (const keyword of topicKeywords) {
    conditions.push(`topic.ilike.*${keyword}*`);
    conditions.push(`subject.ilike.*${keyword}*`);
  }
  
  for (const subject of syllabusSubjects) {
    const cleanSubject = escapePostgrestValue(subject);
    if (cleanSubject) {
      conditions.push(`topic.ilike.*${cleanSubject}*`);
      conditions.push(`subject.ilike.*${cleanSubject}*`);
    }
  }
  
  const uniqueConditions = [...new Set(conditions)];
  console.log(`🔎 Search conditions (${uniqueConditions.length}): ${uniqueConditions.slice(0, 4).join(', ')}...`);
  
  return uniqueConditions.join(',');
}

// Robust JSON parser with repair logic for truncated responses
// ============= TOPIC MISMATCH GUARD (Hotfix: Computer/GK getting Science) =============

/**
 * Returns subject-specific CRITICAL/FORBIDDEN guidance to prepend to the prompt.
 * Targets the recurring failure modes seen in production:
 *  - "Computer (MS Office)" → AI hallucinated states-of-matter / hardware questions
 *  - "General Knowledge"    → AI returned pure science questions
 */
function getSubjectGuidance(topic: string): string {
  const t = (topic || '').toLowerCase();

  if (t.includes('ms office') || t.includes('msoffice') || /\bcomputer\b/.test(t)) {
    return `
🚨 CRITICAL — SUBJECT IS "Computer (MS Office Applications)":
Generate ONLY questions about Microsoft Office software usage:
- MS Word: shortcut keys, formatting, tables, mail merge, track changes, styles
- MS Excel: formulas (SUM, AVERAGE, IF, VLOOKUP, COUNT), charts, pivot tables, cell references
- MS PowerPoint: slides, animations, transitions, slide masters, presenter view
- MS Outlook: email, calendar, tasks, rules
- File operations and ribbon tabs

❌ FORBIDDEN — DO NOT generate questions about:
- Computer hardware (CPU, RAM, motherboard, processor, circuits, transistors)
- Historical computing hardware (vacuum tubes, valves, ENIAC, UNIVAC, mainframes, punched cards, analytical engine, abacus, semiconductors, microchips)
- Programming languages (Python, Java, C++, FORTRAN, COBOL, ALGOL, BASIC, algorithms, data structures, compilers, assemblers)
- History of computing pioneers (von Neumann, Grace Hopper, Ada Lovelace, Babbage, Turing)
- Operating systems internals (kernel, drivers, Linux/Windows installation)
- Networking (IP addresses, OSI model, protocols)
- States of matter, particles, gases, liquids, solids, atoms, molecules (THIS IS PHYSICS/CHEMISTRY — NOT COMPUTER)
- Generic computer-science theory
`;
  }

  if (t.includes('general knowledge') || t === 'gk' || t.includes('(gk)')) {
    return `
🚨 CRITICAL — SUBJECT IS "General Knowledge":
Generate ONLY questions about:
- Pakistan affairs: history, geography, government, constitution, leaders
- Current affairs: recent national/international events, organisations (UN, OIC, SAARC)
- World geography: capitals, rivers, mountains, countries
- Famous personalities, important dates, treaties, wars
- Islamic Studies basics, Pakistan Movement

❌ FORBIDDEN — DO NOT generate questions about:
- Pure science (states of matter, particles, atoms, molecules, amorphous/crystalline solids)
- Chemistry formulas, physics equations
- Advanced mathematics
- MS Office / programming / IT specifics
`;
  }

  if (t.includes('english')) {
    return `
SUBJECT IS "English": grammar, vocabulary, synonyms/antonyms, prepositions, sentence correction, idioms.
DO NOT generate science, math, computer, or general-knowledge questions.
`;
  }

  if (t.includes('math') || t.includes('quantitative')) {
    return `
SUBJECT IS "Mathematics": arithmetic, percentages, ratios, averages, profit/loss, HCF/LCM, basic algebra/geometry.
DO NOT generate science, English, or general-knowledge questions.
`;
  }

  return '';
}

const SCIENCE_KEYWORDS = [
  'gas', 'liquid', 'solid', 'particles', 'matter',
  'molecular', 'amorphous', 'crystalline', 'atom', 'molecule',
  'chemical', 'element', 'compound', 'electron', 'proton', 'neutron'
];
const HARDWARE_KEYWORDS = [
  'cpu', 'ram', 'rom', 'processor', 'motherboard',
  'circuit', 'transistor', 'register', 'alu', 'gpu',
  // Historical computing hardware
  'vacuum tube', 'valve', 'integrated circuit', 'microprocessor',
  'eniac', 'univac', 'mainframe', 'minicomputer',
  'punched card', 'punch card', 'analytical engine', 'difference engine',
  'abacus', 'antikythera', 'semiconductor', 'microchip'
];
const PROGRAMMING_KEYWORDS = [
  'fortran', 'cobol', 'algol', 'basic language', 'compiler', 'assembler',
  'stored program', 'von neumann', 'grace hopper', 'ada lovelace',
  'babbage', 'turing machine'
];
const MS_OFFICE_KEYWORDS = [
  'word', 'excel', 'powerpoint', 'outlook', 'spreadsheet',
  'formula', 'slide', 'cell reference', 'mail merge', 'pivot',
  'vlookup', 'sum(', 'average(', 'ribbon', 'workbook', 'worksheet',
  'document', 'paragraph', 'shortcut', 'ctrl+', 'ctrl +'
];
const GK_MARKERS = [
  'pakistan', 'capital', 'founded', 'prime minister', 'president',
  'river', 'mountain', 'province', 'year', 'war', 'treaty',
  'constitution', 'jinnah', 'iqbal', 'partition', 'independence',
  'organisation', 'organization', 'united nations', 'islamic'
];

function hasAny(text: string, words: string[]): boolean {
  return words.some(w => text.includes(w));
}

/**
 * Diagnostic block printed at every response exit of the user_test_session flow.
 * Helps pinpoint where the question pipeline zeroed out (cache / topic-guard / AI / quota).
 */
function logRequestSummary(info: {
  topic: string;
  sanitized?: string;
  qc: number;
  partial?: boolean;
  forceNew?: boolean;
  cache_found?: number;
  dbQuestions?: number;
  ai_attempted?: number;
  ai_returned?: number;
  ai_saved?: number;
  final_returned: number;
  exit_branch: string;
  error_notice?: string;
}): void {
  const deficit = info.qc - info.final_returned;
  console.log(`
═══════════════════════════════════════
[DEBUG] generate-test summary
Topic: ${info.topic} | Sanitized: ${info.sanitized ?? '-'}
qc: ${info.qc} | partial: ${info.partial ?? false} | forceNew: ${info.forceNew ?? false}
cache_found: ${info.cache_found ?? 0} | dbQuestions: ${info.dbQuestions ?? 0}
ai_attempted: ${info.ai_attempted ?? 0} | ai_returned: ${info.ai_returned ?? 0} | ai_saved: ${info.ai_saved ?? 0}
deficit: ${deficit} | final_returned: ${info.final_returned}
exit_branch: ${info.exit_branch}${info.error_notice ? ` | notice: ${info.error_notice}` : ''}
═══════════════════════════════════════`);
}

/**
 * Reject questions whose content drifts off the requested topic.
 * Returns true = keep, false = reject.
 */
function validateQuestionTopic(question: string, topic: string): boolean {
  if (!question || !topic) return true;
  const q = question.toLowerCase();
  const t = topic.toLowerCase();

  // ----- Computer (MS Office) — relaxed: only science is rejected -----
  // The hardware/programming rejector produces too many false positives on legitimate
  // Office questions (e.g., "Which shortcut key bolds text?" has no MS_OFFICE_KEYWORDS).
  // Prompt's getSubjectGuidance already forbids hardware to the AI; rely on that.
  if (t.includes('ms office') || t.includes('msoffice')) {
    if (hasAny(q, SCIENCE_KEYWORDS)) {
      console.warn(`[topic-guard] ❌ REJECT science for MS Office: "${question.slice(0, 80)}"`);
      return false;
    }
    return true;
  }

  // ----- Pure "Computer" subject (no MS Office qualifier) — strict mode -----
  if (/\bcomputer\b/.test(t)) {
    if (hasAny(q, SCIENCE_KEYWORDS)) {
      console.warn(`[topic-guard] ❌ REJECT science for Computer: "${question.slice(0, 80)}"`);
      return false;
    }
    if ((hasAny(q, HARDWARE_KEYWORDS) || hasAny(q, PROGRAMMING_KEYWORDS)) && !hasAny(q, MS_OFFICE_KEYWORDS)) {
      console.warn(`[topic-guard] ❌ REJECT hardware/programming for Computer: "${question.slice(0, 80)}"`);
      return false;
    }
    return true;
  }

  // ----- General Knowledge -----
  if (t.includes('general knowledge') || t === 'gk' || t.includes('(gk)')) {
    if (hasAny(q, SCIENCE_KEYWORDS) && !hasAny(q, GK_MARKERS)) {
      console.warn(`[topic-guard] ❌ REJECT science for GK: "${question.slice(0, 80)}"`);
      return false;
    }
    return true;
  }

  // English / Math / others — pass-through
  return true;
}

// ============= STRICT MCQ VALIDATION (Pakistani Exam Standards) =============

function validateMCQ(mcq: any): boolean {
  if (!mcq.question || typeof mcq.question !== 'string' || mcq.question.trim().length < 5) {
    console.warn('[validate] Missing or too-short question');
    return false;
  }

  // Patch: accept correct_option as alias for correctOption
  if (!mcq.correctOption && mcq.correct_option) {
    mcq.correctOption = mcq.correct_option;
  }

  // Patch: uppercase lowercase correctOption (a->A, b->B, etc.)
  if (mcq.correctOption && typeof mcq.correctOption === 'string' && /^[a-d]$/.test(mcq.correctOption)) {
    mcq.correctOption = mcq.correctOption.toUpperCase();
  }

  // Check options - support both object {A,B,C,D} and array formats
  if (mcq.options && typeof mcq.options === 'object' && !Array.isArray(mcq.options)) {
    const keys = ['A', 'B', 'C', 'D'];
    // Also accept lowercase keys and patch them
    for (const k of keys) {
      if (!mcq.options[k] && mcq.options[k.toLowerCase()]) {
        mcq.options[k] = mcq.options[k.toLowerCase()];
      }
    }
    for (const k of keys) {
      if (!mcq.options[k] || typeof mcq.options[k] !== 'string' || mcq.options[k].trim().length < 1) {
        console.warn(`[validate] Missing or empty option ${k}`);
        return false;
      }
    }
  } else if (Array.isArray(mcq.options)) {
    if (mcq.options.length !== 4 || mcq.options.some((o: any) => !o || typeof o !== 'string' || o.trim().length < 1)) {
      console.warn('[validate] Options array invalid (need exactly 4 non-empty strings)');
      return false;
    }
  } else {
    console.warn('[validate] Options missing or invalid type');
    return false;
  }

  // Must have a correct answer indicator
  const hasCorrectOption = mcq.correctOption && ['A', 'B', 'C', 'D'].includes(mcq.correctOption);
  const hasAnswer = mcq.answer && typeof mcq.answer === 'string' && mcq.answer.trim().length > 0;
  if (!hasCorrectOption && !hasAnswer) {
    console.warn('[validate] No valid correctOption or answer');
    return false;
  }

  return true;
}

function sanitizeMCQ(mcq: any): Question {
  let optionsArray: string[];
  let answerText: string;

  // Accept correct_option alias
  if (!mcq.correctOption && mcq.correct_option) {
    mcq.correctOption = mcq.correct_option;
  }
  if (mcq.correctOption && typeof mcq.correctOption === 'string' && /^[a-d]$/.test(mcq.correctOption)) {
    mcq.correctOption = mcq.correctOption.toUpperCase();
  }

  // Convert options object {A,B,C,D} to array format
  if (mcq.options && typeof mcq.options === 'object' && !Array.isArray(mcq.options)) {
    // Patch lowercase keys
    for (const k of ['A', 'B', 'C', 'D']) {
      if (!mcq.options[k] && mcq.options[k.toLowerCase()]) {
        mcq.options[k] = mcq.options[k.toLowerCase()];
      }
    }
    optionsArray = ['A', 'B', 'C', 'D'].map(k => mcq.options[k]?.trim() || '');
    if (mcq.correctOption && mcq.options[mcq.correctOption]) {
      answerText = mcq.options[mcq.correctOption].trim();
    } else {
      answerText = mcq.answer?.trim() || optionsArray[0];
    }
  } else {
    optionsArray = (mcq.options as string[]).map((o: string) => o.trim());
    answerText = mcq.answer?.trim() || '';
    if (mcq.correctOption && ['A', 'B', 'C', 'D'].includes(mcq.correctOption)) {
      const idx = mcq.correctOption.charCodeAt(0) - 65;
      if (idx >= 0 && idx < optionsArray.length) {
        answerText = optionsArray[idx];
      }
    }
  }

  // Ensure question ends with ?
  let questionText = mcq.question.trim();
  if (!questionText.endsWith('?') && !questionText.endsWith('.') && !questionText.endsWith(':')) {
    questionText += '?';
  }

  return {
    question: questionText,
    options: optionsArray,
    answer: answerText,
    explanation: (mcq.explanation || '').trim() || undefined,
  };
}

function parseAIResponse(text: string): Question[] {
  console.log(`[parseAIResponse] Raw AI text (first 500 chars): ${text.substring(0, 500)}`);
  
  let jsonText = text.trim();
  
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
  }
  
  // Try direct parse - supports both {questions:[...]} and bare [...] array
  try {
    const parsed = JSON.parse(jsonText);
    const rawQuestions = parsed.questions || (Array.isArray(parsed) ? parsed : []);
    console.log(`[parseAIResponse] Parsed ${rawQuestions.length} raw questions, validating...`);
    const valid = rawQuestions.filter(validateMCQ).map(sanitizeMCQ);
    console.log(`[parseAIResponse] Validation result: ${valid.length}/${rawQuestions.length} passed`);
    if (rawQuestions.length > 0 && valid.length === 0) {
      console.error('[parseAIResponse] ⚠️ ALL questions failed validation. Sample:',
        JSON.stringify(rawQuestions[0]).substring(0, 400));
    }
    return valid;
  } catch (e) {
    console.log('Initial JSON parse failed, attempting repair...');
  }
  
  // Repair: extract individual question objects
  try {
    // Find the array start (either after "questions" key or bare array)
    let arrayStart = -1;
    const questionsKey = jsonText.indexOf('"questions"');
    if (questionsKey !== -1) {
      arrayStart = jsonText.indexOf('[', questionsKey);
    } else {
      arrayStart = jsonText.indexOf('[');
    }
    
    if (arrayStart === -1) {
      throw new Error('No array found');
    }
    
    let arrayContent = jsonText.substring(arrayStart);
    
    const questions: Question[] = [];
    let depth = 0;
    let objStart = -1;
    
    for (let i = 0; i < arrayContent.length; i++) {
      const char = arrayContent[i];
      if (char === '{') {
        if (depth === 0) objStart = i;
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0 && objStart !== -1) {
          const objStr = arrayContent.substring(objStart, i + 1);
          try {
            const q = JSON.parse(objStr);
            if (validateMCQ(q)) {
              questions.push(sanitizeMCQ(q));
            }
          } catch {
            // Skip malformed question
          }
          objStart = -1;
        }
      }
    }
    
    console.log(`Repaired JSON: extracted ${questions.length} valid questions`);
    return questions;
  } catch (repairError) {
    console.error('JSON repair failed:', repairError);
    return [];
  }
}

// Generate questions in batches with HYBRID DEDUPLICATION
// Prevents internal duplicates through fingerprinting + cross-batch memory
async function generateQuestionsInBatches(
  topic: string,
  difficulty: string,
  totalCount: number,
  apiKey: string,
  existingQuestions: string[] = [],
  weakTopics: string[] = []
): Promise<Question[]> {
  const MAX_BATCH_SIZE = 15;
  const batches = Math.ceil(totalCount / MAX_BATCH_SIZE);
  const allQuestions: Question[] = [];
  
  // ============= HYBRID DEDUPLICATION: Intra-run memory =============
  const generatedInThisRun: string[] = []; // Track all questions generated in this run
  const fingerprints = new Set<string>(); // Semantic fingerprints for near-duplicate detection
  const normalizedTexts = new Set<string>(); // Normalized text for exact-ish duplicate detection
  
  // Pre-populate fingerprints from existing questions
  for (const existingQ of existingQuestions) {
    fingerprints.add(generateQuestionFingerprint(existingQ));
    normalizedTexts.add(normalizeQuestionText(existingQ));
  }
  
  console.log(`🧠 Generating ${totalCount} questions in ${batches} batch(es) with HYBRID DEDUPLICATION...`);
  console.log(`   Pre-loaded ${existingQuestions.length} existing questions into memory`);
  
  const MAX_RETRIES = 3;
  let totalApiCalls = 0;
  let totalBatchesAttempted = 0;

  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(MAX_BATCH_SIZE, totalCount - allQuestions.length);
    if (batchSize <= 0) break;

    console.log(`📦 Batch ${batch + 1}/${batches}: Generating ${batchSize} questions...`);
    totalBatchesAttempted++;

    let batchAccepted = 0;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      // Build avoid list: existing DB questions + already generated in this run (last 30)
      const avoidList = [...existingQuestions.slice(-15), ...generatedInThisRun.slice(-15)];

      const avoidSection = avoidList.length > 0
        ? `\n\n⚠️ AVOID THESE EXISTING QUESTIONS (do NOT repeat similar concepts):\n${avoidList.map((q, i) => `${i + 1}. ${q.slice(0, 100)}${q.length > 100 ? '...' : ''}`).join('\n')}`
        : '';

      const weakSection = weakTopics.length > 0
        ? `\n\n🎯 CRITICAL — focus 70% of questions on these weak topics the user struggles with:\n${weakTopics.map((t) => `- ${t}`).join('\n')}\nMake questions progressively harder within these topics.`
        : '';

      const systemPrompt = `You are an expert MCQ generator for Pakistani students preparing for board exams and competitive tests.

🇵🇰 STRICT CURRICULUM RULES — follow ALL of them:
1. Questions MUST be based ONLY on Pakistani curriculum:
   - Matric (9th, 10th) — Punjab Board, Sindh Board, KPK Board, Federal Board, Balochistan Board
   - FSc/FA (11th, 12th) — same boards
   - Competitive exams: NTS, FPSC, PPSC, SPSC, STS, IBA Sukkur
   - University entry tests: MDCAT, ECAT, NTS NAT
2. Language — English ONLY but SIMPLE:
   - Use simple, clear English understandable by an average Pakistani student
   - NO complex/advanced vocabulary
   - NO American/British/Indian curriculum references or phrasing
3. Content accuracy:
   - Questions must match the EXACT topic provided — do NOT drift off-topic
   - Follow Pakistani textbook content (PTBB, Sindh Textbook Board, KPTBB, etc.)
   - Answer options must be factually correct per Pakistani curriculum
4. Question format:
   - 4 options per question (A, B, C, D), one clearly correct answer
   - No trick questions, no ambiguity
   - Difficulty must match requested level (Easy/Medium/Hard/Mix)
5. NEVER generate:
   - Questions about American, British, or Indian curriculum
   - Culturally inappropriate content
   - Ambiguous questions with multiple correct answers
   - Questions outside the Pakistani syllabus

You are a STRICT examiner for Pakistani competitive exams (PPSC, FPSC, NTS, STS, SPSC, IBA Sukkur, ECAT, MDCAT, CSS, PMS).
${getSubjectGuidance(topic)}
🇵🇰 MANDATORY RULES — PAKISTANI EXAM STYLE:

1. Generate SHORT, DIRECT, FACTUAL questions. Maximum 2 lines per question.
2. EVERY question MUST end with "?"
3. Start with: What, Which, How, When, Where, Who, In which, Fill in the blank
4. NEVER use long verbose western-style scenarios or paragraphs
5. EXACTLY 4 options per question labeled A, B, C, D
6. All options must be plausible distractors (not obviously wrong)
7. Use Pakistani context: Pakistani names, cities, institutions, currency (PKR), history
8. Each question must test a DIFFERENT sub-concept
9. Keep STRICTLY to the syllabus topic provided. Do NOT drift to unrelated subjects.

SUBJECT-SPECIFIC PATTERNS (follow FPSC/PPSC/NTS style):

For MS Office / Computer / IT:
- Ask about SPECIFIC shortcut keys (e.g., "Which shortcut key is used to save a file?")
- Ask about ribbon tab locations (e.g., "The 'Mail Merge' option is found in which tab?")
- Ask formula syntax (e.g., "Which Excel function returns the highest value?")
- Keep questions about one specific feature, NOT general overviews

For English:
- Direct synonym/antonym questions (e.g., "What is the synonym of 'Benevolent'?")
- Preposition fill-in-blank (e.g., "He is good ___ mathematics.")
- Sentence correction (e.g., "Identify the error in the sentence:")
- One-word substitution, idioms & phrases
- NO long reading comprehension passages

For Mathematics/Quantitative:
- Arithmetic: percentage, ratio, average, profit/loss, simple/compound interest
- Short numerical problems with direct calculations
- Number theory: HCF, LCM, prime numbers, divisibility

For General Knowledge/Pakistan Affairs:
- Pakistan history: creation, important dates, constitutional amendments
- Geography: rivers, mountains, provinces, districts
- Current affairs: recent events, international organizations
- Islamic Studies: basic concepts, pillars, history

For Science (Physics/Chemistry/Biology):
- MDCAT/ECAT level conceptual questions
- Short factual recall questions
- Direct formula-based questions

🎯 DIVERSITY REQUIREMENTS:
- Each question MUST cover a DIFFERENT sub-concept
- Mix question types: factual recall, application, fill-in-the-blank
- NEVER repeat same concept with different wording

EXAMPLE MCQs (follow this EXACT format):

{
  "question": "Which shortcut key is used to undo the last action in MS Word?",
  "options": {"A": "Ctrl+Z", "B": "Ctrl+Y", "C": "Ctrl+X", "D": "Ctrl+V"},
  "correctOption": "A",
  "explanation": "Ctrl+Z is the universal shortcut for Undo in MS Office applications.",
  "difficulty": "easy"
}

{
  "question": "What is the antonym of 'Eloquent'?",
  "options": {"A": "Fluent", "B": "Articulate", "C": "Inarticulate", "D": "Verbose"},
  "correctOption": "C",
  "explanation": "Inarticulate means unable to express ideas clearly, the opposite of eloquent.",
  "difficulty": "medium"
}

{
  "question": "In which year was the Lahore Resolution passed?",
  "options": {"A": "1930", "B": "1940", "C": "1945", "D": "1947"},
  "correctOption": "B",
  "explanation": "The Lahore Resolution (Pakistan Resolution) was passed on March 23, 1940.",
  "difficulty": "easy"
}

OUTPUT FORMAT — Return ONLY this JSON, NO markdown, NO extra text:
[
  {
    "question": "...",
    "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
    "correctOption": "A",
    "explanation": "...",
    "difficulty": "${difficulty}"
  }
]${weakSection}${avoidSection}`;

      const userPrompt = `Generate exactly ${batchSize} UNIQUE Pakistani exam-style MCQs about "${topic}" at ${difficulty} difficulty.

RULES:
- Every question MUST end with "?" (no statements or definitions)
- Every question MUST have options as {A, B, C, D} object
- Include "correctOption" as letter (A/B/C/D) and "explanation"
- Follow FPSC/PPSC/NTS exam patterns
- Use Pakistani context where relevant
- Return ONLY a valid JSON array, no wrapping object needed`;

      try {
        console.log(`📤 Batch ${batch + 1} attempt ${attempt}/${MAX_RETRIES}: Calling Gemini...`);
        const promptText = `${systemPrompt}\n\n${userPrompt}`;
        totalApiCalls++;

        const result = await callGeminiForBatch(apiKey, promptText, {
          maxOutputTokens: 8000,
          temperature: 0.7
        });

        if (!result.success) {
          if (result.error === 'AUTH_ERROR') {
            throw { status: 403, message: 'Google API key invalid', source: 'google_gemini' };
          }
          if (result.error === 'ALL_MODELS_FAILED') {
            throw { status: 429, message: 'All Gemini models exhausted (rate limited)', source: 'google_gemini' };
          }
          continue;
        }

        const generatedText = result.text;
        if (!generatedText) continue;

        let batchQuestions = parseAIResponse(generatedText);

        // ============= TOPIC-MISMATCH GUARD =============
        const beforeTopicFilter = batchQuestions.length;
        batchQuestions = batchQuestions.filter(q => validateQuestionTopic(q.question, topic));
        const topicRejected = beforeTopicFilter - batchQuestions.length;
        if (topicRejected > 0) {
          console.warn(`[topic-guard] ⚠️ Batch ${batch + 1} attempt ${attempt}: rejected ${topicRejected}/${beforeTopicFilter} for topic mismatch`);
        }

        // ============= POST-GENERATION DEDUPLICATION =============
        let acceptedThisAttempt = 0;
        for (const q of batchQuestions) {
          const normalized = normalizeQuestionText(q.question);
          const fp = generateQuestionFingerprint(q.question);
          if (normalizedTexts.has(normalized)) continue;
          if (fp && fp.split('|').length >= 3 && fingerprints.has(fp)) continue;

          allQuestions.push(q);
          generatedInThisRun.push(q.question);
          normalizedTexts.add(normalized);
          if (fp) fingerprints.add(fp);
          acceptedThisAttempt++;
          batchAccepted++;
        }

        console.log(`✅ Batch ${batch + 1} attempt ${attempt}: ${acceptedThisAttempt} accepted (batch total: ${batchAccepted}/${batchSize})`);

        if (batchAccepted >= batchSize) break;       // got enough → next batch
        if (acceptedThisAttempt > 0) break;          // partial keep → next batch
        console.warn(`🔁 Batch ${batch + 1} retry ${attempt}/${MAX_RETRIES}: 0 accepted (all rejected by topic guard / dedup)`);
      } catch (batchError: any) {
        if (batchError.status === 429 || batchError.status === 403) {
          console.error(`🚫 Batch ${batch + 1} quota/auth error - propagating to caller`);
          throw batchError;
        }
        console.error(`Batch ${batch + 1} attempt ${attempt} error:`, JSON.stringify(batchError));
      }
    } // end retry loop

    if (batch < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // ============= EMERGENCY FALLBACK =============
  // If validator/dedup rejected EVERY batch, try once more with science-only validation
  // to prevent total failure due to over-strict keyword rules.
  if (allQuestions.length === 0 && totalBatchesAttempted >= 1) {
    console.error(`❌ VALIDATOR TOO STRICT: 0 accepted after ${totalBatchesAttempted} batches, ${totalApiCalls} API calls`);
    console.error(`   Topic: "${topic}" | Difficulty: ${difficulty}`);
    console.error(`   🚨 EMERGENCY FALLBACK: Trying one batch with science-only validation`);

    try {
      totalApiCalls++;
      const emergencyPrompt = `You are a STRICT examiner for Pakistani competitive exams.
${getSubjectGuidance(topic)}

Generate exactly ${Math.min(totalCount, 10)} UNIQUE short Pakistani-exam-style MCQs about "${topic}" at ${difficulty} difficulty.
- Every question ends with "?"
- 4 options labeled A, B, C, D
- Include correctOption (A/B/C/D) and explanation
- Return ONLY a JSON array.`;

      const emerg = await callGeminiForBatch(apiKey, emergencyPrompt, { maxOutputTokens: 8000, temperature: 0.8 });
      if (emerg.success && emerg.text) {
        const parsed = parseAIResponse(emerg.text);
        const accepted = parsed.filter((q: any) => {
          const qLower = (q.question || '').toLowerCase();
          if (hasAny(qLower, SCIENCE_KEYWORDS)) {
            console.warn(`  Emergency rejected science: "${(q.question || '').slice(0, 60)}"`);
            return false;
          }
          return true;
        });
        if (accepted.length > 0) {
          console.warn(`✅ Emergency fallback accepted ${accepted.length} questions (science-only filter)`);
          allQuestions.push(...accepted);
        } else {
          console.error(`❌ Emergency fallback: AI returned ${parsed.length} but ALL still rejected`);
        }
      }
    } catch (emergErr: any) {
      console.error(`❌ Emergency fallback threw:`, emergErr?.message || emergErr);
    }
  }

  // ============= FINAL DEFICIT WARNING =============
  if (allQuestions.length < totalCount) {
    console.warn(`⚠️ AI deficit: got ${allQuestions.length}/${totalCount} after ${totalBatchesAttempted} batches, ${totalApiCalls} API calls`);
  }

  if (allQuestions.length === 0) {
    console.error(`
═══════════════════════════════════════
🚨 CRITICAL: ZERO QUESTIONS RETURNED
Topic: ${topic}
Difficulty: ${difficulty}
Batches attempted: ${totalBatchesAttempted}
API calls made: ${totalApiCalls}
Emergency fallback: also failed
ACTION: Check validator keywords / prompt alignment / Gemini quota
═══════════════════════════════════════`);
  }

  console.log(`🧠 HYBRID DEDUP COMPLETE: ${allQuestions.length}/${totalCount} unique questions generated`);
  return allQuestions;
}

// Log AI usage to the database
async function logAIUsage(supabase: any, entry: UsageLogEntry): Promise<void> {
  try {
    const { error } = await supabase
      .from('ai_usage_logs')
      .insert({
        triggered_by_user_id: entry.triggered_by_user_id || null,
        source_type: entry.source_type,
        subject: entry.subject || null,
        topic: entry.topic || null,
        difficulty: entry.difficulty || null,
        questions_requested: entry.questions_requested,
        questions_fetched: entry.questions_fetched,
        questions_saved: entry.questions_saved,
        metadata: entry.metadata || {},
      });

    if (error) {
      console.error('Failed to log AI usage:', error);
    } else {
      console.log(`📊 AI Usage logged: ${entry.source_type} - Requested: ${entry.questions_requested}, Fetched: ${entry.questions_fetched}, Saved: ${entry.questions_saved}`);
    }
  } catch (err) {
    console.error('Error logging AI usage:', err);
  }
}

// Check if a question is a duplicate (text similarity)
async function checkDuplicate(supabase: any, questionText: string): Promise<{ isDuplicate: boolean; originalId?: string; originalTitle?: string }> {
  try {
    // Exact match check
    const { data: exactMatch } = await supabase
      .from('content_items')
      .select('id, title')
      .eq('category', 'mcq')
      .neq('status', 'flagged_duplicate')
      .eq('title', questionText)
      .limit(1)
      .maybeSingle();
    
    if (exactMatch) {
      return { isDuplicate: true, originalId: exactMatch.id, originalTitle: exactMatch.title };
    }
    
    // Fuzzy match: Check if first 50 chars match (catches minor variations)
    const prefix = questionText.slice(0, 50);
    const { data: fuzzyMatch } = await supabase
      .from('content_items')
      .select('id, title')
      .eq('category', 'mcq')
      .neq('status', 'flagged_duplicate')
      .ilike('title', `${prefix}%`)
      .limit(1)
      .maybeSingle();
    
    if (fuzzyMatch) {
      return { isDuplicate: true, originalId: fuzzyMatch.id, originalTitle: fuzzyMatch.title };
    }
    
    return { isDuplicate: false };
  } catch (err) {
    console.error('Duplicate check error:', err);
    return { isDuplicate: false };
  }
}

// Background task to save remaining questions after returning response
// Now with Human-in-the-Loop duplicate handling - flags duplicates instead of discarding
// ZERO DATA LOSS: Every question is saved (approved or flagged)
async function saveQuestionsInBackground(
  questions: Question[],
  topic: string,
  sanitizedTopic: string,
  difficulty: string,
  supabase: any,
  sourceTag: string = 'ai',
  lmsLinkageFields: Record<string, any> = {}
): Promise<{ saved: number; flagged: number }> {
  console.log(`📦 Background task: Saving ${questions.length} questions with ZERO LOSS...`);
  
  let totalSaved = 0;
  let totalFlagged = 0;
  const batchInsertedTitles = new Set<string>();
  
  for (const q of questions) {
    const shortId = crypto.randomUUID().slice(0, 8);
    let saved = false;
    let retryAttempt = 0;
    const maxRetries = 3;
    
    while (!saved && retryAttempt <= maxRetries) {
      try {
        // Check for duplicates
        const isIntraBatchDuplicate = batchInsertedTitles.has(q.question.toLowerCase().trim());
        const dupCheck = await checkDuplicate(supabase, q.question);
        const isDuplicate = isIntraBatchDuplicate || dupCheck.isDuplicate || retryAttempt > 0;
        
        // Build title with unique suffix on retries
        let finalTitle = q.question;
        if (isDuplicate && retryAttempt === 0) {
          finalTitle = `[POTENTIAL DUPLICATE] ${q.question}`;
        } else if (retryAttempt > 0) {
          finalTitle = `[ERROR/DUPLICATE-${shortId}] ${q.question}`;
        }
        
        const canonicalTopicName = topic 
          ? topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
          : null;

        const questionData = {
          title: finalTitle,
          description: q.explanation || '',
          category: 'mcq',
          subject: topic,
          topic: topic,
          canonical_topic_name: canonicalTopicName,
          ...lmsLinkageFields, // overrides topic_id / canonical_topic_name when caller provided LMS UUIDs
          difficulty: toValidDifficulty(difficulty, (q as any).difficulty),
          options: q.options,
          correct_option: q.answer,
          explanation: q.explanation || '',
          status: isDuplicate ? 'flagged_duplicate' : 'approved',
          show_in_subjects: !isDuplicate,
          show_in_mock_tests: !isDuplicate,
          reference_material: JSON.stringify({
            source_role: topic,
            original_topic: sanitizedTopic,
            generated_at: new Date().toISOString(),
            generator: sourceTag,
            original_title: q.question,
            ...(dupCheck.isDuplicate && {
              duplicate_of_id: dupCheck.originalId,
              duplicate_of_title: dupCheck.originalTitle
            }),
            ...(isIntraBatchDuplicate && { intra_batch_duplicate: true }),
            ...(retryAttempt > 0 && { retry_reason: 'constraint_violation', retry_attempt: retryAttempt })
          })
        };

        const { error: insertError } = await supabase
          .from('content_items')
          .insert(questionData);

        if (insertError) {
          console.error(`Insert error (attempt ${retryAttempt + 1}):`, insertError.message);
          retryAttempt++;
        } else {
          batchInsertedTitles.add(q.question.toLowerCase().trim());
          saved = true;
          
          if (isDuplicate) {
            totalFlagged++;
            console.log(`🚩 Flagged duplicate: "${q.question.slice(0, 40)}..."`);
          } else {
            totalSaved++;
          }
        }
      } catch (err) {
        console.error('Save error:', err);
        retryAttempt++;
      }
    }
    
    // If all retries failed, count as flagged anyway for zero-loss reporting
    if (!saved) {
      totalFlagged++;
      console.error(`❌ Failed to save after ${maxRetries} retries: "${q.question.slice(0, 40)}..."`);
    }
  }
  
  console.log(`📦 Background task completed: ${totalSaved} saved, ${totalFlagged} flagged (ZERO LOSS: ${totalSaved + totalFlagged}/${questions.length})`);
  return { saved: totalSaved, flagged: totalFlagged };
}

// Background generation + saving (combined for EdgeRuntime.waitUntil)
async function backgroundGenerateAndSave(
  topic: string,
  sanitizedTopic: string,
  difficulty: string,
  missingCount: number,
  existingQuestionTexts: string[],
  apiKey: string,
  supabase: any,
  userId?: string,
  sourceType: 'user_test_session' | 'admin_bulk_generator' = 'user_test_session',
  lmsLinkageFields: Record<string, any> = {}
): Promise<void> {
  console.log(`🚀 BACKGROUND: Starting generation of ${missingCount} questions for "${topic}"`);
  
  try {
    const newQuestions = await generateQuestionsInBatches(
      topic, 
      difficulty, 
      missingCount, 
      apiKey,
      existingQuestionTexts
    );
    
    console.log(`🚀 BACKGROUND: Generated ${newQuestions.length} questions`);
    
    let savedCount = 0;
    let flaggedCount = 0;
    if (newQuestions.length > 0) {
      const result = await saveQuestionsInBackground(
        newQuestions, 
        topic, 
        sanitizedTopic, 
        difficulty, 
        supabase,
        sourceType === 'admin_bulk_generator' ? 'admin_bulk' : 'ai',
        lmsLinkageFields
      );
      savedCount = result.saved;
      flaggedCount = result.flagged;
    }
    
    // Log the usage
    await logAIUsage(supabase, {
      triggered_by_user_id: userId,
      source_type: sourceType,
      subject: sanitizedTopic,
      topic: topic,
      difficulty: difficulty,
      questions_requested: missingCount,
      questions_fetched: newQuestions.length,
      questions_saved: savedCount,
      metadata: { background: true, flagged_duplicates: flaggedCount }
    });
    
    console.log(`🚀 BACKGROUND: Complete - ${newQuestions.length} questions saved to DB`);
  } catch (err) {
    console.error('🚀 BACKGROUND: Generation/saving failed:', err);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============= JWT AUTHENTICATION =============
    // Verify user identity and extract verified user_id from token
    const authHeader = req.headers.get('Authorization');
    let verified_user_id: string | undefined;
    
    // Check if this is a service-role call (from scheduled-autofill or internal)
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const isServiceRoleCall = authHeader?.includes(supabaseServiceKey);
    let isGuest = false;

    if (isServiceRoleCall) {
      console.log('🔐 Service role call detected - authorized');
    } else if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      // If the bearer is the anon key, treat as guest (no user JWT)
      if (token === supabaseAnonKey) {
        isGuest = true;
        console.log('👤 Guest request (anon key) - will be gated to fetch_only');
      } else {
        // Initialize auth client for verification
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const authClient = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } }
        });
        const { data, error } = await authClient.auth.getClaims(token);
        if (!error && data?.claims?.sub) {
          verified_user_id = data.claims.sub;
          console.log('🔐 Authenticated user:', verified_user_id);
        } else {
          // Treat invalid/expired token as guest rather than hard-rejecting
          isGuest = true;
          console.log('👤 Treating as guest (token not a valid user JWT):', error?.message);
        }
      }
    } else {
      isGuest = true;
      console.log('👤 No Authorization header - treating as guest');
    }
    // ============= END JWT AUTHENTICATION =============

    const { 
      topic: rawTopic, 
      difficulty, 
      question_count, 
      forceNew, 
      requestId, 
      partial_mode, 
      fetch_only,
      mode, // 'bank_only' | 'ai_coach'
      user_stats, // for ai_coach mode
      language, // 'en' | 'ur' | 'sd'
      source, // 'auto_fill' for auto-fill feature
      topic_id, // UUID for FK link to topics table
      topic_ids, // Array of UUIDs from Syllabus Builder
      subject_id, // UUID for FK link to subjects table (Subject Pages)
      subject_name, // Actual subject name (e.g. "Biology") from Subject Pages
      canonical_topic_name: client_canonical_topic_name, // Optional: provided by Subject Pages
      session_id, // Session ID to update with generated questions (Job Tests)
      excludeQuestionIds, // AI Coach: per-user exclusion list (UUIDs of already-attempted questions)
      weakTopics, // AI Coach Phase 2: focus 70% of generated questions on these
      // user_id is intentionally IGNORED - we use verified_user_id from JWT instead
    } = await req.json();

    // Sanitize excludeQuestionIds — strict UUID validation prevents injection via .in() string
    const safeExcludeIds: string[] = Array.isArray(excludeQuestionIds)
      ? excludeQuestionIds.filter((id: any) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
      : [];
    if (safeExcludeIds.length > 0) {
      console.log(`🎯 AI Coach: excluding ${safeExcludeIds.length} previously attempted question(s) from cache`);
    }

    // Sanitize weakTopics — strings only, max 10 × 80 chars
    const safeWeakTopics: string[] = Array.isArray(weakTopics)
      ? weakTopics
          .filter((t: any) => typeof t === 'string' && t.trim().length > 0)
          .slice(0, 10)
          .map((t: string) => t.trim().slice(0, 80))
      : [];
    if (safeWeakTopics.length > 0) {
      console.log(`🎯 AI Coach: focusing prompt on ${safeWeakTopics.length} weak topic(s)`);
    }

    // Use verified user ID from JWT, not from request body
    const user_id = verified_user_id;

    // Initialize Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ============= AI COACH MODE =============
    if (mode === 'ai_coach') {
      if (!verified_user_id) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const stats = user_stats || {};
      const totalTests = stats.totalTests || 0;
      const avgScore = stats.avgScore || 0;
      const weakSubjects = stats.weakSubjects || [];
      const strongSubjects = stats.strongSubjects || [];
      const recentAttempts = stats.recentAttempts || [];
      const lang = language || 'en';

      const trendText = recentAttempts.length >= 2
        ? (() => {
            const recent = recentAttempts.slice(0, 3);
            const older = recentAttempts.slice(3, 6);
            const recentAvg = recent.reduce((s: number, a: any) => s + (a.score || 0), 0) / (recent.length || 1);
            const olderAvg = older.length
              ? older.reduce((s: number, a: any) => s + (a.score || 0), 0) / older.length
              : recentAvg;
            const diff = Math.round(recentAvg - olderAvg);
            if (diff > 5) return `improving by ${diff} points recently`;
            if (diff < -5) return `declining by ${Math.abs(diff)} points recently`;
            return 'staying consistent';
          })()
        : 'just starting out';

      const langInstructions = lang === 'ur'
        ? 'Mix Hinglish with Urdu. Use Roman Urdu naturally. Example: "Yaar, mehnat karo — امتحان قریب ہے!"'
        : lang === 'sd'
        ? 'Mix Hinglish with Sindhi. Example: "Bhai, محنت ڪر — result سٺو ايندو!"'
        : 'Use pure Hinglish — mix of Hindi, Urdu, English in Roman script.';

      const aiCoachPrompt = `You are "Ustaad" — a funny, caring, senior Pakistani student who gives advice like a best friend. 
You know everything about Pakistani exams (Matric, FSc, NTS, FPSC, PPSC, MDCAT, ECAT).

PERSONALITY RULES:
- Talk like a desi best friend — funny but purposeful
- Use "yaar", "bhai", "arre" naturally  
- Reference Pakistani life: load shedding, reels, chai, cricket
- NEVER demotivate — always end with hope + action
- Be specific — give exact minutes, exact topics
- Respectful always — no gender assumptions
- ${langInstructions}

STUDENT DATA:
- Total tests attempted: ${totalTests}
- Average score: ${avgScore}%
- Performance trend: ${trendText}
- Weak subjects: ${weakSubjects.length ? weakSubjects.join(', ') : 'none identified yet'}
- Strong subjects: ${strongSubjects.length ? strongSubjects.join(', ') : 'none yet'}
- Recent attempts: ${recentAttempts.slice(0, 5).map((a: any) => `${a.subject} ${a.score}% (${a.date})`).join(', ') || 'none'}

ADVICE RULES:
1. Start with encouragement — acknowledge effort
2. Point out 1-2 specific weak areas with exact data
3. If improving — celebrate with desi energy
4. If streak is 0 — mention load shedding joke
5. Give EXACT tomorrow plan: subject + minutes
6. End with motivational 1-liner

IMPORTANT:
- Max 80 words
- No bullet points — flowing paragraph
- Must mention at least 1 specific subject from data
- Never say "I cannot" or "As an AI"

Write the advice now:`;

      try {
        const result = await callAIWithAutoSwitch('You are Ustaad, a desi senior student giving short personalized study advice.', aiCoachPrompt);

        if (result && result.text) {
          // Log usage
          await supabase
            .from('ai_usage_logs')
            .insert({
              user_id: verified_user_id,
              feature: 'ai_coach_advice',
              questions_requested: 0,
              questions_saved: 0,
            });

          // Deduct 10 credits
          await supabase.rpc('deduct_credits', {
            p_user_id: verified_user_id,
            p_amount: 10,
            p_action_type: 'AI Coach Advice',
            p_details: 'Personalized Ustaad advice',
          });

          return new Response(
            JSON.stringify({ advice: result.text.trim(), credits_deducted: 10 }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ advice: null }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (e) {
        console.error('AI Coach error:', e);
        return new Response(
          JSON.stringify({ error: 'AI Coach failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    // ============= END AI COACH MODE =============

    let topic = rawTopic;
    if (!topic && topic_ids && Array.isArray(topic_ids) && topic_ids.length > 0) {
      try {
        const { data: topicRows } = await supabase
          .from('topics')
          .select('name')
          .in('id', topic_ids)
          .limit(1);
        if (topicRows && topicRows.length > 0) {
          topic = topicRows[0].name;
          console.log(`📌 Resolved topic from topic_ids: "${topic}"`);
        } else {
          topic = 'General Knowledge';
          console.log('⚠️ Could not resolve topic_ids, using fallback: "General Knowledge"');
        }
      } catch (e) {
        topic = 'General Knowledge';
        console.error('⚠️ Error resolving topic_ids:', e);
      }
    }
    
    // Final safety: ensure topic is always a string
    if (!topic || typeof topic !== 'string') {
      topic = 'General Knowledge';
      console.log('⚠️ No topic provided, using fallback: "General Knowledge"');
    }

    const qc = Number(question_count) || 10;
    const usePartialMode = partial_mode === true;
    const isFetchOnly = fetch_only === true || isGuest; // Guests can only read from DB
    const isBankOnly = mode === 'bank_only';
    const isAutoFill = source === 'auto_fill';
    const isLargeRequest = qc > 20;
    const autoPartial = partial_mode === false ? false : (usePartialMode || isLargeRequest);
    const sourceType: 'user_test_session' | 'admin_bulk_generator' | 'auto_fill' = 
      isAutoFill ? 'auto_fill' : (isBankOnly ? 'admin_bulk_generator' : 'user_test_session');

    // Centralized LMS linkage fields — applied to every content_items insert below
    // so AI-generated MCQs from Subject Pages / Syllabus Builder show up under the
    // correct topic in the LMS / Question Bank inventory.
    const resolvedTopicIdForLink: string | null =
      topic_id || (Array.isArray(topic_ids) && topic_ids.length > 0 ? topic_ids[0] : null);
    // Unified canonical key = slug(subject)-slug(topic) so the same subject+topic
    // is shared across every board (reader, writer, and health RPC use this format).
    const slugifyPart = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const resolvedCanonicalTopicName: string | null = (
      client_canonical_topic_name ||
      (topic
        ? (subject_name && slugifyPart(subject_name) && slugifyPart(subject_name) !== slugifyPart(topic)
            ? `${slugifyPart(subject_name)}-${slugifyPart(topic)}`
            : slugifyPart(topic))
        : null)
    ) || null;
    const lmsLinkageFields: Record<string, any> = {
      ...(resolvedTopicIdForLink ? { topic_id: resolvedTopicIdForLink } : {}),
      ...(resolvedCanonicalTopicName ? { canonical_topic_name: resolvedCanonicalTopicName } : {}),
      ...(subject_name ? { subject: subject_name } : {}),
    };

    // ──────────────────────────────────────────────────────────────────
    // ensureTopicExists: when an authenticated, non-guest request has a
    // subject_id + topic name but no topic row yet, create one so AI-saved
    // questions link to a real topic and admin panel inventory stays in
    // sync with the frontend.
    // ──────────────────────────────────────────────────────────────────
    let autoCreatedTopic = false;
    if (
      !isFetchOnly &&
      !resolvedTopicIdForLink &&
      subject_id &&
      typeof topic === 'string' &&
      topic.trim().length > 0 &&
      topic !== 'General Knowledge'
    ) {
      try {
        const trimmedTopic = topic.trim();
        const { data: existing } = await supabase
          .from('topics')
          .select('id')
          .eq('subject_id', subject_id as string)
          .ilike('name', trimmedTopic)
          .maybeSingle();

        if (existing?.id) {
          lmsLinkageFields.topic_id = existing.id;
          console.log(`🔗 ensureTopicExists: matched existing topic id=${existing.id}`);
        } else {
          const { data: created, error: createErr } = await supabase
            .from('topics')
            .insert({
              subject_id: subject_id as string,
              name: trimmedTopic,
              approved: true,
              auto_created: true,
              created_by_ai: true,
            })
            .select('id')
            .single();
          if (createErr) {
            console.warn('⚠️ ensureTopicExists insert failed:', createErr.message);
          } else if (created?.id) {
            lmsLinkageFields.topic_id = created.id;
            autoCreatedTopic = true;
            console.log(`✨ ensureTopicExists: created topic id=${created.id} name="${trimmedTopic}"`);
          }
        }
      } catch (e) {
        console.warn('⚠️ ensureTopicExists threw:', e);
      }
    }
    console.log(`💾 PERSISTENCE_PREP: topic_id=${lmsLinkageFields.topic_id || null} canonical=${lmsLinkageFields.canonical_topic_name || null} auto_created=${autoCreatedTopic}`);
    
    console.log('📥 Request received:', { 
      topic, 
      difficulty, 
      question_count: qc, 
      forceNew: !!forceNew, 
      partial_mode: usePartialMode,
      fetch_only: isFetchOnly,
      mode: mode || 'default',
      source: source || 'user',
      topic_id: topic_id || null,
      topic_ids: topic_ids || null,
      auto_partial: autoPartial,
      requestId,
      authenticated: !!verified_user_id,
      timestamp: new Date().toISOString(),
      userAgent: req.headers.get('user-agent')?.slice(0, 50),
      referer: req.headers.get('referer'),
    });

    // Sanitize topic for flexible matching
    const sanitizedTopic = sanitizeTopic(topic);
    console.log(`Topic: "${topic}" → Sanitized: "${sanitizedTopic}"`);

    // Get syllabus subjects for this topic (if it's a job test)
    const syllabusSubjects = getSyllabusSubjects(topic);
    const hasSyllabus = syllabusSubjects.length > 0;
    
    if (hasSyllabus) {
      console.log(`📚 SYLLABUS ACTIVE for "${topic}" → Searching: [${syllabusSubjects.join(', ')}]`);
    } else {
      console.log(`📘 DIRECT MODE for "${sanitizedTopic}" (no syllabus expansion)`);
    }

    // Build search conditions
    const simpleKeywords = extractKeywords(sanitizedTopic);
    const simpleConditions = simpleKeywords.length > 0
      ? simpleKeywords.flatMap(kw => [`topic.ilike.*${kw}*`, `subject.ilike.*${kw}*`]).join(',')
      : `topic.ilike.*${escapePostgrestValue(sanitizedTopic)}*,subject.ilike.*${escapePostgrestValue(sanitizedTopic)}*`;
    
    const searchConditions = hasSyllabus 
      ? buildSyllabusSearchConditions(topic, sanitizedTopic, syllabusSubjects)
      : simpleConditions;

    // Database Check (Cache Layer)
    console.log('Step 1: Checking database for existing questions...');

    let dbQuestions: Question[] = [];
    let existingQuestionTexts: string[] = [];

    if (!forceNew) {
      try {
        const difficultyLower = String(difficulty || 'medium').toLowerCase();

        // ============= STRICT ID-BASED SCOPING (Hotfix for topic mismatch) =============
        // When the caller (e.g. Quizzes / Subject Pages) provides a topic_id or subject_id,
        // bypass the loose ilike keyword search and query strictly by FK columns.
        // This prevents cross-subject leakage like Physics MCQs showing up in a
        // Geography quiz just because both contain the word "Pakistan".
        const hasStrictTopicScope = !!resolvedTopicIdForLink;
        const hasStrictSubjectScope = !!subject_id;
        const hasStrictCanonicalScope = !!resolvedCanonicalTopicName;

        let existingQuestions: any[] | null = null;
        let dbError: any = null;

        // Resolve subject name from subject_id (content_items has TEXT `subject`,
        // not a `subject_id` FK column — filtering by subject_id directly returns 0 rows).
        let resolvedSubjectName: string | null = null;
        let resolvedSubjectTopicIds: string[] = [];
        let resolvedSubjectTopicNames: string[] = [];
        let resolvedSubjectCanonicalNames: string[] = [];
        if (hasStrictSubjectScope) {
          try {
            const { data: subjRow } = await supabase
              .from('subjects')
              .select('name')
              .eq('id', subject_id as string)
              .maybeSingle();
            if (subjRow?.name) resolvedSubjectName = subjRow.name;

            const { data: subjectTopics } = await supabase
              .from('topics')
              .select('id, name')
              .eq('subject_id', subject_id as string)
              .or('approved.is.null,approved.eq.true');

            resolvedSubjectTopicIds = (subjectTopics || []).map((t: any) => t.id).filter(Boolean);
            resolvedSubjectTopicNames = (subjectTopics || []).map((t: any) => t.name).filter(Boolean);
            resolvedSubjectCanonicalNames = resolvedSubjectTopicNames
              .map((name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
              .filter(Boolean);
          } catch (e) {
            console.warn('Could not resolve subject name for subject_id:', subject_id, e);
          }
        }

        if (hasStrictTopicScope) {
          // Tier 1: strict topic_id match
          let q = supabase
            .from('content_items')
            .select('id, title, options, correct_option, explanation, topic, subject, difficulty')
            .eq('category', 'mcq')
            .eq('status', 'approved')
            .not('quality_grade', 'in', '(D,F)')
            .eq('topic_id', resolvedTopicIdForLink as string);
          if (safeExcludeIds.length > 0) q = q.not('id', 'in', `(${safeExcludeIds.join(',')})`);
          const r = await q.limit(qc * 3);
          existingQuestions = r.data;
          dbError = r.error;
          console.log(`🔒 STRICT topic_id="${resolvedTopicIdForLink}" → ${existingQuestions?.length ?? 0} rows`);

          // Tier 2: canonical_topic_name fallback when topic_id has no rows
          if (!dbError && (!existingQuestions || existingQuestions.length === 0) && hasStrictCanonicalScope) {
            let q2 = supabase
              .from('content_items')
              .select('id, title, options, correct_option, explanation, topic, subject, difficulty')
              .eq('category', 'mcq')
              .eq('status', 'approved')
              .not('quality_grade', 'in', '(D,F)')
              .eq('canonical_topic_name', resolvedCanonicalTopicName as string);
            if (safeExcludeIds.length > 0) q2 = q2.not('id', 'in', `(${safeExcludeIds.join(',')})`);
            const r2 = await q2.limit(qc * 3);
            existingQuestions = r2.data;
            dbError = r2.error;
            console.log(`🔒 STRICT canonical="${resolvedCanonicalTopicName}" → ${existingQuestions?.length ?? 0} rows`);
          }

          // Tier 3: keyword search BUT scoped to subject (text column)
          if (!dbError && (!existingQuestions || existingQuestions.length === 0) && hasStrictSubjectScope && resolvedSubjectName) {
            let q3 = supabase
              .from('content_items')
              .select('id, title, options, correct_option, explanation, topic, subject, difficulty')
              .eq('category', 'mcq')
              .eq('status', 'approved')
              .not('quality_grade', 'in', '(D,F)')
              .eq('subject', resolvedSubjectName)
              .or(searchConditions);
            if (safeExcludeIds.length > 0) q3 = q3.not('id', 'in', `(${safeExcludeIds.join(',')})`);
            const r3 = await q3.limit(qc * 3);
            existingQuestions = r3.data;
            dbError = r3.error;
            console.log(`🔒 SCOPED subject="${resolvedSubjectName}" keyword search → ${existingQuestions?.length ?? 0} rows`);
          }
        } else if (hasStrictSubjectScope && resolvedSubjectName) {
          // Subject Quiz: random mix from all topics within the selected subject.
          // Legacy cached rows often store the *topic name* in content_items.subject,
          // so querying subject='Pakistan Studies' alone returns 0. Merge strict LMS
          // topic_id rows with legacy topic/subject text rows from this subject's topics.
          const mergedById = new Map<string, any>();
          const subjectLimit = Math.max(qc * 3, 30);
          const mergeRows = (rows: any[] | null | undefined) => {
            for (const row of rows || []) {
              if (row?.id && !mergedById.has(row.id)) mergedById.set(row.id, row);
            }
          };
          const baseSelect = 'id, title, options, correct_option, explanation, topic, subject, difficulty';

          // Perf: these subject-scope lookups are independent (they all merge into
          // mergedById by id). Run them in ONE parallel wave instead of awaiting each
          // sequentially. Selects already request only the needed columns (no select('*')).
          const textScopes = [...new Set([resolvedSubjectName, ...resolvedSubjectTopicNames].filter(Boolean))];

          const buildScoped = () => {
            let base = supabase
              .from('content_items')
              .select(baseSelect)
              .eq('category', 'mcq')
              .eq('status', 'approved')
              .not('quality_grade', 'in', '(D,F)');
            if (safeExcludeIds.length > 0) base = base.not('id', 'in', `(${safeExcludeIds.join(',')})`);
            return base;
          };

          const scopedQueries: Promise<{ data: any[] | null; error: any }>[] = [];

          if (resolvedSubjectTopicIds.length > 0) {
            scopedQueries.push(buildScoped().in('topic_id', resolvedSubjectTopicIds).limit(subjectLimit));
          }
          if (resolvedSubjectCanonicalNames.length > 0) {
            scopedQueries.push(buildScoped().in('canonical_topic_name', resolvedSubjectCanonicalNames).limit(subjectLimit));
          }
          if (textScopes.length > 0) {
            scopedQueries.push(buildScoped().in('topic', textScopes).limit(subjectLimit));
            scopedQueries.push(buildScoped().in('subject', textScopes).limit(subjectLimit));
          }
          if (resolvedSubjectName) {
            scopedQueries.push(buildScoped().ilike('topic', `%${resolvedSubjectName}%`).limit(subjectLimit));
          }

          const scopedResults = await Promise.all(scopedQueries);
          for (const r of scopedResults) {
            if (r.error) dbError = r.error;
            mergeRows(r.data);
          }

          existingQuestions = Array.from(mergedById.values());
          console.log(`🔒 STRICT subject="${resolvedSubjectName}" topics=${resolvedSubjectTopicIds.length} → ${existingQuestions?.length ?? 0} rows`);

        } else {
          // Legacy callers: original behavior
          let cacheQuery = supabase
            .from('content_items')
            .select('id, title, options, correct_option, explanation, topic, subject, difficulty')
            .eq('category', 'mcq')
            .eq('status', 'approved')
            .not('quality_grade', 'in', '(D,F)')
            .or(searchConditions);
          if (safeExcludeIds.length > 0) {
            cacheQuery = cacheQuery.not('id', 'in', `(${safeExcludeIds.join(',')})`);
          }
          const r = await cacheQuery.limit(qc * 3);
          existingQuestions = r.data;
          dbError = r.error;
        }

        if (dbError) {
          console.error('❌ Database query error:', dbError);
        } else if (existingQuestions && existingQuestions.length > 0) {
          const foundTopics = [...new Set(existingQuestions.map(q => q.topic || q.subject).filter(Boolean))];
          console.log(`📊 Found questions from: [${foundTopics.slice(0, 5).join(', ')}${foundTopics.length > 5 ? '...' : ''}]`);
          
          const shuffledDbResults = shuffleArray(existingQuestions);
          
          dbQuestions = shuffledDbResults
            .filter(q => q.title && q.options && q.correct_option)
            .map(normalizeDbQuestion);

          // ============= TOPIC-MISMATCH GUARD ON CACHE (Hotfix) =============
          // Drop poisoned cache rows so they aren't served, forcing a fresh generation
          // for subjects where the AI historically drifted off-topic.
          const beforeCacheFilter = dbQuestions.length;
          if (hasStrictTopicScope || !hasStrictSubjectScope) {
            dbQuestions = dbQuestions.filter(q => validateQuestionTopic(q.question, topic));
          }
          const cacheDropped = beforeCacheFilter - dbQuestions.length;
          if (cacheDropped > 0) {
            console.warn(`[topic-guard] 🧹 Cache: dropped ${cacheDropped}/${beforeCacheFilter} poisoned rows for topic="${topic}"`);
          }

          existingQuestionTexts = dbQuestions.map(q => q.question);

          console.log(`✅ Found ${dbQuestions.length} existing questions in database (after topic guard)`);
        } else {
          console.log(`🔎 CACHE MISS: 0 questions found for "${sanitizedTopic}"`);
        }
      } catch (dbErr) {
        console.error('Database check failed:', dbErr);
      }
    } else {
      console.log('forceNew=true: skipping cache and generating fresh questions');
    }

    // FETCH_ONLY MODE
    if (isFetchOnly) {
      console.log(`🔍 FETCH_ONLY: Returning ${dbQuestions.length} cached questions`);
      const returnedQuestions = shuffleArray(dbQuestions).slice(0, qc);
      
      return new Response(
        JSON.stringify({
          session_name: `${topic} Quiz`,
          questions: returnedQuestions,
          source: 'cache',
          cached_count: returnedQuestions.length,
          ai_count: 0,
          remaining_count: Math.max(0, qc - returnedQuestions.length),
          total_requested: qc
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // BANK_ONLY MODE (Admin Bulk Generator)
    // Generate questions and insert directly to content_items - ZERO DATA LOSS
    // All questions are saved: approved or flagged_duplicate with modified title
    if (isBankOnly) {
      // ============= ADMIN GUARD =============
      // bank_only mode writes status='approved' content via service role and bypasses
      // the per-user credit system. Restrict to admins or service-role (auto-fill) callers.
      if (!isServiceRoleCall) {
        if (!verified_user_id) {
          return new Response(
            JSON.stringify({ error: 'Authentication required for bank_only mode' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const { data: roleRow } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', verified_user_id)
          .eq('role', 'admin')
          .maybeSingle();
        if (!roleRow) {
          console.log(`[generate-test] ⛔ bank_only blocked for non-admin user: ${verified_user_id}`);
          return new Response(
            JSON.stringify({ error: 'Admin privileges required for bank_only mode' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      console.log(`🏭 BANK_ONLY MODE: Generating ${qc} questions for question bank with HYBRID DEDUP`);
      
      // ============= QUOTA CHECK (only for AI-generating modes) =============
      try {
        const quota = await checkQuota(supabase);
        console.log(`[generate-test] 📊 Quota remaining: ${quota.remaining}`);
      } catch (err) {
        if (err instanceof QuotaExhaustedError) {
          return quotaExhaustedResponse(corsHeaders);
        }
        throw err;
      }

      const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
      if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
      }

      // ============= FIX: Fetch existing questions for deduplication =============
      // This prevents the AI from generating duplicates of existing DB content
      let existingTitlesForDedup: string[] = [];
      try {
        const { data: recentQuestions } = await supabase
          .from('content_items')
          .select('title')
          .eq('category', 'mcq')
          .eq('status', 'approved')
          .or(`topic.ilike.*${escapePostgrestValue(sanitizedTopic)}*,subject.ilike.*${escapePostgrestValue(sanitizedTopic)}*`)
          .order('created_at', { ascending: false })
          .limit(100);
        
        existingTitlesForDedup = recentQuestions?.map(q => q.title).filter(Boolean) || [];
        console.log(`🧠 Loaded ${existingTitlesForDedup.length} existing questions for deduplication`);
      } catch (err) {
        console.error('Failed to load existing questions for dedup:', err);
      }

      // Generate questions with HYBRID DEDUPLICATION (intra-batch + cross-DB)
      let newQuestions: Question[] = [];
      try {
        newQuestions = await generateQuestionsInBatches(
          topic,
          difficulty,
          qc,
          GEMINI_API_KEY,
          existingTitlesForDedup // NOW passing existing questions!
        );
      } catch (genError: any) {
        // Handle quota/rate limit errors gracefully for bank_only mode
        if (genError.status === 429 || genError.status === 403) {
          console.error(`🚫 BANK_ONLY: AI quota exhausted (${genError.status}). Returning error response.`);
          return new Response(
            JSON.stringify({
              success: false,
              mode: 'bank_only',
              error: genError.status === 429 
                ? 'Google AI quota exceeded. Please wait or upgrade your plan.'
                : 'API key invalid or quota exceeded.',
              error_type: genError.status === 429 ? 'quota' : 'auth',
              questions_requested: qc,
              questions_generated: 0,
              questions_saved: 0
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
        throw genError; // Re-throw unexpected errors
      }

      console.log(`🏭 Generated ${newQuestions.length} new questions - saving ALL to database`);

      // Track questions inserted in this batch to detect intra-batch duplicates
      const batchInsertedTitles = new Set<string>();
      let savedCount = 0;
      let flaggedCount = 0;
      let failedCount = 0;

      // Helper function to force-save a question (ALWAYS succeeds)
      const forceSaveQuestion = async (q: Question, retryAttempt: number = 0): Promise<'approved' | 'flagged' | 'failed'> => {
        const maxRetries = 3;
        const shortId = crypto.randomUUID().slice(0, 8);
        
        // Check if this is a duplicate within the current batch
        const isIntraBatchDuplicate = batchInsertedTitles.has(q.question.toLowerCase().trim());
        
        // Check for duplicates in existing DB
        const dupCheck = await checkDuplicate(supabase, q.question);
        const isDuplicate = isIntraBatchDuplicate || dupCheck.isDuplicate;
        
        // Determine title - modify if duplicate to bypass unique constraint
        let finalTitle = isDuplicate 
          ? `[POTENTIAL DUPLICATE] ${q.question}`
          : q.question;
        
        // On retries, add unique suffix to guarantee uniqueness
        if (retryAttempt > 0) {
          finalTitle = `[ERROR/DUPLICATE-${shortId}] ${q.question}`;
        }
        
        const questionData = {
          title: finalTitle,
          description: q.explanation || '',
          category: 'mcq',
          subject: sanitizedTopic,
          topic: topic,
          ...lmsLinkageFields, // topic_id + canonical_topic_name (overrides legacy topic_id below)
          topic_id: topic_id || (topic_ids && Array.isArray(topic_ids) && topic_ids.length > 0 ? topic_ids[0] : null),
          difficulty: toValidDifficulty(difficulty, (q as any).difficulty),
          options: q.options,
          correct_option: q.answer,
          explanation: q.explanation || '',
          status: isDuplicate || retryAttempt > 0 ? 'flagged_duplicate' : 'approved',
          show_in_subjects: !isDuplicate && retryAttempt === 0,
          show_in_mock_tests: !isDuplicate && retryAttempt === 0,
          reference_material: JSON.stringify({
            source_role: topic,
            original_topic: sanitizedTopic,
            generated_at: new Date().toISOString(),
            generator: isAutoFill ? 'auto_fill' : 'admin_bulk',
            original_title: q.question,
            ...(topic_id && { topic_id_linked: topic_id }),
            ...(dupCheck.isDuplicate && {
              duplicate_of_id: dupCheck.originalId,
              duplicate_of_title: dupCheck.originalTitle
            }),
            ...(isIntraBatchDuplicate && { intra_batch_duplicate: true }),
            ...(retryAttempt > 0 && { retry_reason: 'constraint_violation', retry_attempt: retryAttempt })
          })
        };

        const { error: insertError } = await supabase
          .from('content_items')
          .insert(questionData);

        if (insertError) {
          console.error(`Insert error (attempt ${retryAttempt + 1}):`, insertError.message);
          
          // Retry with modified title if not at max retries
          if (retryAttempt < maxRetries) {
            return await forceSaveQuestion(q, retryAttempt + 1);
          }
          
          // Last resort: force insert with guaranteed unique title
          const emergencyData = {
            ...questionData,
            title: `[FORCE-SAVE-${shortId}] ${q.question.slice(0, 200)}`,
            status: 'flagged_duplicate',
            show_in_subjects: false,
            show_in_mock_tests: false,
            reference_material: JSON.stringify({
              ...JSON.parse(questionData.reference_material),
              emergency_save: true,
              original_error: insertError.message
            })
          };
          
          const { error: emergencyError } = await supabase
            .from('content_items')
            .insert(emergencyData);
          
          if (emergencyError) {
            console.error(`EMERGENCY SAVE FAILED:`, emergencyError.message);
            return 'failed'; // Nothing was actually stored — do not count as saved
          }
          
          return 'flagged';
        }
        
        // Track this title for intra-batch duplicate detection
        batchInsertedTitles.add(q.question.toLowerCase().trim());
        
        return isDuplicate || retryAttempt > 0 ? 'flagged' : 'approved';
      };

      // Process all questions with force-save
      for (const q of newQuestions) {
        try {
          const result = await forceSaveQuestion(q);
          if (result === 'approved') {
            savedCount++;
          } else if (result === 'flagged') {
            flaggedCount++;
            console.log(`🚩 Saved as flagged: "${q.question.slice(0, 40)}..."`);
          } else {
            failedCount++;
            console.log(`❌ Not saved (insert failed): "${q.question.slice(0, 40)}..."`);
          }
        } catch (err) {
          console.error('Unexpected save error:', err);
          failedCount++;
        }
      }

      // Only rows that actually made it into content_items count as saved.
      const totalSaved = savedCount + flaggedCount;
      console.log(`🏭 Save complete: ${totalSaved}/${newQuestions.length} stored (${savedCount} approved, ${flaggedCount} flagged, ${failedCount} failed)`);

      // Log AI usage - reflects rows truly written to the DB
      await logAIUsage(supabase, {
        triggered_by_user_id: user_id,
        source_type: 'admin_bulk_generator',
        subject: sanitizedTopic,
        topic: topic,
      difficulty: difficulty || 'Medium',
        questions_requested: qc,
        questions_fetched: newQuestions.length,
        questions_saved: totalSaved,
        metadata: { approved: savedCount, flagged_duplicates: flaggedCount, failed: failedCount, zero_loss: totalSaved === newQuestions.length }
      });

      return new Response(
        JSON.stringify({
          success: true,
          mode: 'bank_only',
          questions_requested: qc,
          questions_generated: newQuestions.length,
          questions_saved: totalSaved,
          questions_approved: savedCount,
          duplicates_flagged: flaggedCount,
          questions_failed: failedCount,
          topic: topic,
          difficulty: difficulty
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }


    // IMMEDIATE RETURN: FULL CACHE
    if (!forceNew && dbQuestions.length >= qc) {
      console.log('⚡ INSTANT: Sufficient questions in cache, skipping AI call');
      const selected = enrichQuestionsForSession(
        shuffleArray(dbQuestions).slice(0, qc),
        topic,
        sanitizedTopic,
        difficulty,
      );

      // Log cache hit
      await logAIUsage(supabase, {
        triggered_by_user_id: user_id,
        source_type: sourceType,
        subject: sanitizedTopic,
        topic: topic,
        difficulty: difficulty,
        questions_requested: qc,
        questions_fetched: 0,
        questions_saved: 0,
        metadata: { cache_hit: true, cached_available: dbQuestions.length }
      });

      await syncQuestionsToSession(supabase, session_id, selected);

      logRequestSummary({ topic, sanitized: sanitizedTopic, qc, forceNew, cache_found: dbQuestions.length, dbQuestions: dbQuestions.length, final_returned: selected.length, exit_branch: 'instant_cache' });

      return new Response(
        JSON.stringify({
          session_name: `${topic} Quiz`,
          questions: selected,
          source: 'cache',
          cached_count: selected.length,
          ai_count: 0,
          remaining_count: 0,
          total_requested: qc
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // IMMEDIATE RETURN: PARTIAL MODE
    if (autoPartial && dbQuestions.length > 0 && !forceNew) {
      const returnedQuestions = enrichQuestionsForSession(
        shuffleArray(dbQuestions).slice(0, Math.min(dbQuestions.length, qc)),
        topic,
        sanitizedTopic,
        difficulty,
      );
      const missingCount = qc - returnedQuestions.length;
      
      console.log(`⚡ PARTIAL MODE ACTIVE: Returning ${returnedQuestions.length} questions, Generating ${missingCount} in background`);
      
      if (missingCount > 0) {
        const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY');
        if (GEMINI_KEY) {
          (globalThis as any).EdgeRuntime?.waitUntil(
            backgroundGenerateAndSave(
              topic,
              sanitizedTopic,
              difficulty,
              missingCount,
              existingQuestionTexts,
              GEMINI_KEY,
              supabase,
              user_id,
              sourceType as any,
              lmsLinkageFields
            )
          );
        }
      }

      await syncQuestionsToSession(supabase, session_id, returnedQuestions);

      logRequestSummary({ topic, sanitized: sanitizedTopic, qc, partial: true, forceNew, cache_found: dbQuestions.length, dbQuestions: dbQuestions.length, final_returned: returnedQuestions.length, exit_branch: 'partial' });

      return new Response(
        JSON.stringify({
          session_name: `${topic} Quiz`,
          questions: returnedQuestions,
          source: 'cache_partial',
          cached_count: returnedQuestions.length,
          ai_count: 0,
          remaining_count: missingCount,
          total_requested: qc
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // FULL AI GENERATION
    const missingCount = forceNew ? qc : qc - dbQuestions.length;
    console.log(`Step 2: Need ${missingCount} questions from AI (have ${dbQuestions.length} from cache)`);

    // ============= QUOTA CHECK (before full AI generation) =============
    try {
      const quota = await checkQuota(supabase);
      console.log(`[generate-test] 📊 Quota remaining before AI gen: ${quota.remaining}`);
    } catch (err) {
      if (err instanceof QuotaExhaustedError) {
        // If we have cached questions, return those instead of failing
        if (dbQuestions.length > 0) {
          const returnedQuestions = enrichQuestionsForSession(
            shuffleArray(dbQuestions).slice(0, qc),
            topic,
            sanitizedTopic,
            difficulty,
          );
          await syncQuestionsToSession(supabase, session_id, returnedQuestions);
          logRequestSummary({ topic, sanitized: sanitizedTopic, qc, forceNew, cache_found: dbQuestions.length, dbQuestions: dbQuestions.length, final_returned: returnedQuestions.length, exit_branch: 'quota_fallback', error_notice: 'quota_exhausted' });
          return new Response(
            JSON.stringify({
              session_name: `${topic} Quiz`,
              questions: returnedQuestions,
              source: 'cache',
              cached_count: returnedQuestions.length,
              ai_count: 0,
              remaining_count: Math.max(0, qc - returnedQuestions.length),
              total_requested: qc,
              ai_unavailable: true,
              error_type: 'quota_exhausted',
              error_notice: 'Daily AI quota exhausted. Showing cached questions only.'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
        return quotaExhaustedResponse(corsHeaders);
      }
      throw err;
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    console.log(`🔑 GEMINI_API_KEY configured: ${GEMINI_API_KEY ? 'Yes' : 'NO - MISSING!'}`);
    
    if (!GEMINI_API_KEY) {
      logRequestSummary({ topic, sanitized: sanitizedTopic, qc, forceNew, cache_found: dbQuestions.length, dbQuestions: dbQuestions.length, final_returned: 0, exit_branch: 'no_gemini_key' });
      return new Response(
        JSON.stringify({
          error: 'GEMINI_API_KEY not configured',
          error_type: 'config_error',
          details: 'GEMINI_API_KEY is missing from Supabase secrets'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    let newAIQuestions: Question[] = [];

    // ============= PER-USER CREDIT GATE =============
    let userCreditsRemaining: number | null = null;
    let userCreditsExhausted = false;
    if (user_id) {
      try {
        const { data: ucRow } = await supabase
          .from('user_credits')
          .select('credits_remaining, last_reset_date')
          .eq('user_id', user_id)
          .maybeSingle();
        const today = new Date().toISOString().slice(0, 10);
        const effectiveRemaining = (ucRow?.last_reset_date && ucRow.last_reset_date < today)
          ? 100
          : (ucRow?.credits_remaining ?? 100);
        userCreditsRemaining = effectiveRemaining;
        if (effectiveRemaining <= 0) {
          userCreditsExhausted = true;
          console.log(`[generate-test] 🛑 User ${user_id} has 0 AI credits today. Returning cache-only.`);
        } else if (effectiveRemaining < missingCount) {
          console.log(`[generate-test] ⚠️ User credits (${effectiveRemaining}) < missing (${missingCount}). Capping AI gen.`);
        }
      } catch (e) {
        console.warn('[generate-test] credit check failed (continuing):', (e as any)?.message);
      }
    }

    if (userCreditsExhausted) {
      const returned = enrichQuestionsForSession(
        shuffleArray(dbQuestions).slice(0, qc),
        topic, sanitizedTopic, difficulty,
      );
      await syncQuestionsToSession(supabase, session_id, returned);
      return new Response(JSON.stringify({
        session_name: `${topic} Quiz`,
        questions: returned,
        source: returned.length ? 'cache' : 'empty',
        cached_count: returned.length,
        ai_count: 0,
        remaining_count: Math.max(0, qc - returned.length),
        total_requested: qc,
        ai_unavailable: true,
        credits_exhausted: true,
        error_type: 'user_credits_exhausted',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    const aiTarget = userCreditsRemaining !== null
      ? Math.min(missingCount, userCreditsRemaining)
      : missingCount;

    console.log(`[generate-test] 🔄 SYNC GEN: topic="${topic}", deficit=${missingCount}, aiTarget=${aiTarget}, cached=${dbQuestions.length}, requested=${qc}, partial=${usePartialMode}`);

    try {
      newAIQuestions = await generateQuestionsInBatches(
        topic,
        difficulty,
        aiTarget,
        GEMINI_API_KEY,
        existingQuestionTexts,
        safeWeakTopics
      );
      console.log(`🤖 AI generated ${newAIQuestions.length} new questions total`);
      // Deduct user credits based on what was actually generated
      if (user_id && newAIQuestions.length > 0) {
        try {
          const detailParts: string[] = [];
          if (typeof topic === 'string' && topic) detailParts.push(`Topic: ${topic}`);
          if (typeof difficulty === 'string' && difficulty) detailParts.push(`Difficulty: ${difficulty}`);
          detailParts.push(`Questions: ${newAIQuestions.length}`);
          await supabase.rpc('deduct_credits', {
            p_user_id: user_id,
            p_amount: newAIQuestions.length,
            p_action_type: 'Generated Questions',
            p_details: detailParts.join(' • '),
          });
        } catch (e) { console.warn('deduct_credits failed:', (e as any)?.message); }
      }
      console.log(`[generate-test] ✅ SYNC GEN RESULT: topic="${topic}", ai_returned=${newAIQuestions.length}, cached=${dbQuestions.length}, total=${dbQuestions.length + newAIQuestions.length}/${qc}`);
    } catch (aiError: any) {
      console.error(`🚨 AI Generation Error:`, JSON.stringify(aiError));
      
      // Handle Google API quota/auth errors with cache fallback (return 200 to prevent client exceptions)
      // Note: 402 removed - that was Lovable Gateway specific, we now use Google Gemini directly
      if (aiError.status === 429 || aiError.status === 403) {
        const errorType = aiError.status === 429 ? 'google_quota_exceeded' : 'google_auth_error';
        console.log(`🔑 Google AI unavailable (${errorType}). Returning cache-only response (HTTP 200).`);

        // If forceNew=true, we may have skipped cache lookup earlier. Try a cache read now.
        if (dbQuestions.length === 0) {
          try {
            let fallbackQuery = supabase
              .from('content_items')
              .select('id, title, options, correct_option, explanation, topic, subject, difficulty')
              .eq('category', 'mcq')
              .eq('status', 'approved')
              .or(searchConditions);
            if (safeExcludeIds.length > 0) {
              fallbackQuery = fallbackQuery.not('id', 'in', `(${safeExcludeIds.join(',')})`);
            }
            const { data: existingQuestions, error: dbError } = await fallbackQuery.limit(qc * 3);

            if (dbError) {
              console.error('❌ Cache fallback query error:', dbError);
            } else if (existingQuestions && existingQuestions.length > 0) {
              const shuffledDbResults = shuffleArray(existingQuestions);
              dbQuestions = shuffledDbResults
                .filter(q => q.title && q.options && q.correct_option)
                .map(normalizeDbQuestion);

              // Topic-mismatch guard on fallback cache too
              const beforeCacheFilter = dbQuestions.length;
              dbQuestions = dbQuestions.filter(q => validateQuestionTopic(q.question, topic));
              const cacheDropped = beforeCacheFilter - dbQuestions.length;
              if (cacheDropped > 0) {
                console.warn(`[topic-guard] 🧹 Fallback cache: dropped ${cacheDropped}/${beforeCacheFilter} poisoned rows`);
              }

              existingQuestionTexts = dbQuestions.map(q => q.question);
              console.log(`✅ Cache fallback: found ${dbQuestions.length} questions (after topic guard)`);
            } else {
              console.log('🔎 Cache fallback: no questions found');
            }
          } catch (dbErr) {
            console.error('Cache fallback failed:', dbErr);
          }
        }

        const returnedQuestions = enrichQuestionsForSession(
          shuffleArray(dbQuestions).slice(0, qc),
          topic,
          sanitizedTopic,
          difficulty,
        );
        await syncQuestionsToSession(supabase, session_id, returnedQuestions);
        const errorNotice = aiError.status === 429 
          ? 'Google AI quota exceeded. Showing cached questions only.'
          : aiError.status === 403 
            ? 'API key invalid or quota exceeded. Showing cached questions only.'
            : 'AI credits exhausted. Showing cached questions only.';

        logRequestSummary({ topic, sanitized: sanitizedTopic, qc, forceNew, cache_found: dbQuestions.length, dbQuestions: dbQuestions.length, ai_attempted: missingCount, ai_returned: 0, final_returned: returnedQuestions.length, exit_branch: 'ai_error_fallback', error_notice: errorNotice });
        return new Response(
          JSON.stringify({
            session_name: `${topic} Quiz`,
            questions: returnedQuestions,
            source: 'cache',
            cached_count: returnedQuestions.length,
            ai_count: 0,
            remaining_count: Math.max(0, qc - returnedQuestions.length),
            total_requested: qc,
            ai_unavailable: true,
            error_type: errorType,
            error_notice: errorNotice
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      if (dbQuestions.length > 0) {
        console.log('AI failed, returning available DB questions');
        const returnedQuestions = enrichQuestionsForSession(
          shuffleArray(dbQuestions),
          topic,
          sanitizedTopic,
          difficulty,
        );
        await syncQuestionsToSession(supabase, session_id, returnedQuestions);
        logRequestSummary({ topic, sanitized: sanitizedTopic, qc, forceNew, cache_found: dbQuestions.length, dbQuestions: dbQuestions.length, ai_attempted: missingCount, ai_returned: 0, final_returned: returnedQuestions.length, exit_branch: 'ai_error_fallback' });
        return new Response(
          JSON.stringify({
            session_name: `${topic} Quiz`,
            questions: returnedQuestions,
            source: 'cache_partial',
            cached_count: returnedQuestions.length,
            ai_count: 0,
            remaining_count: qc - returnedQuestions.length,
            total_requested: qc
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      throw aiError;
    }

    // Save new questions
    let savedCount = 0;
    let skippedCount = 0;
    
    let flaggedCount = 0;
    if (newAIQuestions.length > 0) {
      console.log('Step 3: Saving new questions to database with duplicate detection...');
      
      const IMMEDIATE_LIMIT = 20;
      
      if (newAIQuestions.length <= IMMEDIATE_LIMIT) {
        for (const q of newAIQuestions) {
          try {
            // Check for duplicates
            const dupCheck = await checkDuplicate(supabase, q.question);
            
            const questionPayload = {
              title: q.question,
              description: q.explanation || '',
              category: 'mcq',
              subject: subject_name || sanitizedTopic,
              topic: topic,
              ...lmsLinkageFields,
              difficulty: toValidDifficulty(difficulty, (q as any).difficulty),
              options: q.options,
              correct_option: q.answer,
              explanation: q.explanation || '',
              status: dupCheck.isDuplicate ? 'flagged_duplicate' : 'approved',
              show_in_subjects: !dupCheck.isDuplicate,
              show_in_mock_tests: !dupCheck.isDuplicate,
              reference_material: JSON.stringify({
                source_role: topic,
                original_topic: sanitizedTopic,
                resolved_subject: subject_name || null,
                curriculum: 'Pakistan',
                generated_at: new Date().toISOString(),
                generator: 'ai',
                ...(dupCheck.isDuplicate && {
                  duplicate_of_id: dupCheck.originalId,
                  duplicate_of_title: dupCheck.originalTitle
                })
              })
            };

            const { error: insertError } = await supabase
              .from('content_items')
              .insert(questionPayload);

            if (insertError) {
              // If duplicate, skip silently — question already exists
              if ((insertError as any).code === '23505') {
                console.log('Duplicate question skipped:', q.question?.slice(0, 50));
                savedCount++;
                continue;
              }
              console.error('Failed to save question, retrying once:', insertError.message);
              // Retry once with upsert to gracefully handle conflicts
              const { error: retryError } = await supabase
                .from('content_items')
                .upsert({ ...questionPayload, status: 'approved', show_in_subjects: true }, { onConflict: 'title,subject', ignoreDuplicates: true });
              if (retryError) {
                console.error('Retry failed, emergency save (minimal payload):', retryError.message);
                const { error: emergencyError } = await supabase
                  .from('content_items')
                  .insert({
                    title: q.question,
                    description: q.explanation || '',
                    category: 'mcq',
                    subject: subject_name || sanitizedTopic,
                    topic: topic,
                    options: q.options,
                    correct_option: q.answer,
                    status: 'approved',
                    show_in_subjects: true,
                  });
                if (emergencyError) {
                  console.error('Emergency save also failed:', emergencyError.message);
                } else {
                  savedCount++;
                }
              } else {
                savedCount++;
              }
            } else {
              if (dupCheck.isDuplicate) {
                flaggedCount++;
              } else {
                savedCount++;
              }
            }
          } catch (saveErr) {
            console.error('Error saving question:', saveErr);
          }
        }
        
        console.log(`✅ Saved ${savedCount} questions, flagged ${flaggedCount} for review`);
      } else {
        console.log(`Large batch (${newAIQuestions.length}): Using background task to save`);
        (globalThis as any).EdgeRuntime?.waitUntil(
          saveQuestionsInBackground(newAIQuestions, topic, sanitizedTopic, difficulty, supabase, 'ai', lmsLinkageFields)
        );
        savedCount = newAIQuestions.length; // Estimate for logging
      }
    }

    // Log AI usage
    await logAIUsage(supabase, {
      triggered_by_user_id: user_id,
      source_type: sourceType,
      subject: sanitizedTopic,
      topic: topic,
      difficulty: difficulty,
      questions_requested: qc,
      questions_fetched: newAIQuestions.length,
      questions_saved: savedCount,
      metadata: { cache_used: dbQuestions.length, flagged_duplicates: flaggedCount }
    });

    // Combine and return
    const allQuestions = [...dbQuestions, ...newAIQuestions];
    
    if (allQuestions.length === 0) {
      throw new Error('No questions could be generated');
    }
    
    const finalQuestions = enrichQuestionsForSession(
      shuffleArray(allQuestions).slice(0, qc),
      topic,
      sanitizedTopic,
      difficulty,
    );

    await syncQuestionsToSession(supabase, session_id, finalQuestions);

    const sourceTypeResponse = dbQuestions.length === 0 ? 'ai' : 
                       newAIQuestions.length === 0 ? 'cache' : 'hybrid';

    console.log(`✅ Returning ${finalQuestions.length} questions (${dbQuestions.length} cached + ${newAIQuestions.length} new) - Source: ${sourceTypeResponse}`);

    logRequestSummary({ topic, sanitized: sanitizedTopic, qc, forceNew, cache_found: dbQuestions.length, dbQuestions: dbQuestions.length, ai_attempted: missingCount, ai_returned: newAIQuestions.length, ai_saved: savedCount, final_returned: finalQuestions.length, exit_branch: 'sync_gen' });

    return new Response(
      JSON.stringify({
        session_name: `${topic} Quiz`,
        questions: finalQuestions,
        source: sourceTypeResponse,
        cached_count: Math.min(dbQuestions.length, qc),
        ai_count: newAIQuestions.length,
        remaining_count: 0,
        total_requested: qc
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in generate-test:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to generate test questions'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
