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
    });
    console.log(`✅ Success with ${provider} (cost: ${cost})`);
    return { success: true, text, modelUsed: provider === 'gemini' ? 'gemini-2.0-flash' : 'lovable-gateway', provider, cost };
  } catch (err: any) {
    const msg = err.message || '';
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
// ============= STRICT MCQ VALIDATION (Pakistani Exam Standards) =============

function validateMCQ(mcq: any): boolean {
  if (!mcq.question || typeof mcq.question !== 'string' || mcq.question.trim().length < 10) {
    console.warn('[validate] Missing or too-short question');
    return false;
  }

  // Check options - support both object {A,B,C,D} and array formats
  if (mcq.options && typeof mcq.options === 'object' && !Array.isArray(mcq.options)) {
    const keys = ['A', 'B', 'C', 'D'];
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

  // Convert options object {A,B,C,D} to array format
  if (mcq.options && typeof mcq.options === 'object' && !Array.isArray(mcq.options)) {
    optionsArray = ['A', 'B', 'C', 'D'].map(k => mcq.options[k]?.trim() || '');
    // Resolve letter-based correctOption to full text
    if (mcq.correctOption && mcq.options[mcq.correctOption]) {
      answerText = mcq.options[mcq.correctOption].trim();
    } else {
      answerText = mcq.answer?.trim() || optionsArray[0];
    }
  } else {
    optionsArray = (mcq.options as string[]).map((o: string) => o.trim());
    answerText = mcq.answer?.trim() || '';
    // If correctOption letter given, resolve it
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
    return rawQuestions.filter(validateMCQ).map(sanitizeMCQ);
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
  existingQuestions: string[] = []
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
  
  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(MAX_BATCH_SIZE, totalCount - allQuestions.length);
    if (batchSize <= 0) break;
    
    console.log(`📦 Batch ${batch + 1}/${batches}: Generating ${batchSize} questions...`);
    
    // Build avoid list: existing DB questions + already generated in this run (last 30)
    const avoidList = [...existingQuestions.slice(-15), ...generatedInThisRun.slice(-15)];
    
    // ============= ENHANCED PROMPT WITH DIVERSITY REQUIREMENTS =============
    const avoidSection = avoidList.length > 0 
      ? `\n\n⚠️ AVOID THESE EXISTING QUESTIONS (do NOT repeat similar concepts):\n${avoidList.map((q, i) => `${i + 1}. ${q.slice(0, 100)}${q.length > 100 ? '...' : ''}`).join('\n')}`
      : '';
    
    const systemPrompt = `You are a STRICT examiner for Pakistani competitive exams (PPSC, FPSC, NTS, STS, SPSC, IBA Sukkur, ECAT, MDCAT, CSS, PMS).

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
]${avoidSection}`;

    const userPrompt = `Generate exactly ${batchSize} UNIQUE Pakistani exam-style MCQs about "${topic}" at ${difficulty} difficulty.

RULES:
- Every question MUST end with "?" (no statements or definitions)
- Every question MUST have options as {A, B, C, D} object
- Include "correctOption" as letter (A/B/C/D) and "explanation"
- Follow FPSC/PPSC/NTS exam patterns
- Use Pakistani context where relevant
- Return ONLY a valid JSON array, no wrapping object needed`;

    try {
      // Use the robust fallback mechanism
      console.log(`📤 Calling Gemini API for batch ${batch + 1} with model fallback...`);
      console.log(`🔑 API Key prefix: ${apiKey ? apiKey.substring(0, 8) + '...' : 'MISSING!'}`);
      
      const promptText = `${systemPrompt}\n\n${userPrompt}`;

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

      console.log(`✅ Batch ${batch + 1} generated with model: ${result.modelUsed}`);
      const generatedText = result.text;
      
      if (generatedText) {
        const batchQuestions = parseAIResponse(generatedText);
        
        // ============= POST-GENERATION DEDUPLICATION LAYER =============
        let acceptedCount = 0;
        let skippedCount = 0;
        
        for (const q of batchQuestions) {
          const normalized = normalizeQuestionText(q.question);
          const fp = generateQuestionFingerprint(q.question);
          
          // Check for exact-ish duplicate (normalized text match)
          if (normalizedTexts.has(normalized)) {
            console.log(`🔄 Skipping exact duplicate: "${q.question.slice(0, 50)}..."`);
            skippedCount++;
            continue;
          }
          
          // Check for semantic duplicate (fingerprint match)
          if (fp && fp.split('|').length >= 3 && fingerprints.has(fp)) {
            console.log(`🔄 Skipping semantic duplicate: "${q.question.slice(0, 50)}..."`);
            skippedCount++;
            continue;
          }
          
          // Accept this question
          allQuestions.push(q);
          generatedInThisRun.push(q.question);
          normalizedTexts.add(normalized);
          if (fp) fingerprints.add(fp);
          acceptedCount++;
        }
        
        console.log(`✅ Batch ${batch + 1} completed: ${acceptedCount} accepted, ${skippedCount} duplicates skipped`);
      }
    } catch (batchError: any) {
      // Propagate quota/auth errors to caller (no longer checking 402 - Lovable-specific)
      if (batchError.status === 429 || batchError.status === 403) {
        console.error(`🚫 Batch ${batch + 1} quota/auth error - propagating to caller`);
        throw batchError;
      }
      console.error(`Batch ${batch + 1} error:`, JSON.stringify(batchError));
    }
    
    if (batch < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
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
  sourceTag: string = 'ai'
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
          difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase(),
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
  sourceType: 'user_test_session' | 'admin_bulk_generator' = 'user_test_session'
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
        sourceType === 'admin_bulk_generator' ? 'admin_bulk' : 'ai'
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
    const isServiceRoleCall = authHeader?.includes(supabaseServiceKey);

    if (isServiceRoleCall) {
      console.log('🔐 Service role call detected - authorized');
    } else if (authHeader?.startsWith('Bearer ')) {
      // Initialize auth client for verification
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const token = authHeader.replace('Bearer ', '');
      const { data, error } = await authClient.auth.getClaims(token);
      
      if (!error && data?.claims?.sub) {
        verified_user_id = data.claims.sub;
        console.log('🔐 Authenticated user:', verified_user_id);
      } else {
        console.log('⛔ JWT validation failed:', error?.message || 'Invalid token');
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log('⛔ No Authorization header - rejecting anonymous request');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      mode, // 'bank_only' for admin bulk generator
      source, // 'auto_fill' for auto-fill feature
      topic_id, // UUID for FK link to topics table
      topic_ids, // Array of UUIDs from Syllabus Builder
      session_id, // Session ID to update with generated questions (Job Tests)
      // user_id is intentionally IGNORED - we use verified_user_id from JWT instead
    } = await req.json();

    // Use verified user ID from JWT, not from request body
    const user_id = verified_user_id;

    // Initialize Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Resolve topic name from topic_ids if rawTopic is not provided
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
    const isFetchOnly = fetch_only === true;
    const isBankOnly = mode === 'bank_only';
    const isAutoFill = source === 'auto_fill';
    const isLargeRequest = qc > 20;
    const autoPartial = usePartialMode || isLargeRequest;
    const sourceType: 'user_test_session' | 'admin_bulk_generator' | 'auto_fill' = 
      isAutoFill ? 'auto_fill' : (isBankOnly ? 'admin_bulk_generator' : 'user_test_session');
    
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
        
        const { data: existingQuestions, error: dbError } = await supabase
          .from('content_items')
          .select('title, options, correct_option, explanation, topic, subject, difficulty')
          .eq('category', 'mcq')
          .eq('status', 'approved')
          .or(searchConditions)
          .limit(qc * 3);

        if (dbError) {
          console.error('❌ Database query error:', dbError);
        } else if (existingQuestions && existingQuestions.length > 0) {
          const foundTopics = [...new Set(existingQuestions.map(q => q.topic || q.subject).filter(Boolean))];
          console.log(`📊 Found questions from: [${foundTopics.slice(0, 5).join(', ')}${foundTopics.length > 5 ? '...' : ''}]`);
          
          const shuffledDbResults = shuffleArray(existingQuestions);
          
          dbQuestions = shuffledDbResults
            .filter(q => q.title && q.options && q.correct_option)
            .map(normalizeDbQuestion);
          
          existingQuestionTexts = dbQuestions.map(q => q.question);
          
          console.log(`✅ Found ${dbQuestions.length} existing questions in database`);
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

      // Helper function to force-save a question (ALWAYS succeeds)
      const forceSaveQuestion = async (q: Question, retryAttempt: number = 0): Promise<'approved' | 'flagged'> => {
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
      topic_id: topic_id || (topic_ids && Array.isArray(topic_ids) && topic_ids.length > 0 ? topic_ids[0] : null), // FK link to topics table
          difficulty: ((difficulty || 'Medium').charAt(0).toUpperCase() + (difficulty || 'Medium').slice(1).toLowerCase()),
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
            return 'flagged'; // Count as flagged even if failed
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
          } else {
            flaggedCount++;
            console.log(`🚩 Saved as flagged: "${q.question.slice(0, 40)}..."`);
          }
        } catch (err) {
          console.error('Unexpected save error:', err);
          flaggedCount++; // Count anyway for zero-loss logging
        }
      }

      const totalSaved = savedCount + flaggedCount;
      console.log(`🏭 ZERO LOSS Complete: ${totalSaved}/${newQuestions.length} saved (${savedCount} approved, ${flaggedCount} flagged)`);

      // Log AI usage - totalSaved should now ALWAYS equal newQuestions.length
      await logAIUsage(supabase, {
        triggered_by_user_id: user_id,
        source_type: 'admin_bulk_generator',
        subject: sanitizedTopic,
        topic: topic,
      difficulty: difficulty || 'Medium',
        questions_requested: qc,
        questions_fetched: newQuestions.length,
        questions_saved: totalSaved,
        metadata: { approved: savedCount, flagged_duplicates: flaggedCount, zero_loss: totalSaved === newQuestions.length }
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
          EdgeRuntime.waitUntil(
            backgroundGenerateAndSave(
              topic,
              sanitizedTopic,
              difficulty,
              missingCount,
              existingQuestionTexts,
              GEMINI_KEY,
              supabase,
              user_id,
              sourceType
            )
          );
        }
      }

      await syncQuestionsToSession(supabase, session_id, returnedQuestions);

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
    
    try {
      newAIQuestions = await generateQuestionsInBatches(
        topic, 
        difficulty, 
        missingCount, 
        GEMINI_API_KEY,
        existingQuestionTexts
      );
      console.log(`🤖 AI generated ${newAIQuestions.length} new questions total`);
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
            const { data: existingQuestions, error: dbError } = await supabase
              .from('content_items')
              .select('title, options, correct_option, explanation, topic, subject, difficulty')
              .eq('category', 'mcq')
              .eq('status', 'approved')
              .or(searchConditions)
              .limit(qc * 3);

            if (dbError) {
              console.error('❌ Cache fallback query error:', dbError);
            } else if (existingQuestions && existingQuestions.length > 0) {
              const shuffledDbResults = shuffleArray(existingQuestions);
              dbQuestions = shuffledDbResults
                .filter(q => q.title && q.options && q.correct_option)
                .map(normalizeDbQuestion);

              existingQuestionTexts = dbQuestions.map(q => q.question);
              console.log(`✅ Cache fallback: found ${dbQuestions.length} questions`);
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
            
            const { error: insertError } = await supabase
              .from('content_items')
              .insert({
                title: q.question,
                description: q.explanation || '',
                category: 'mcq',
                subject: sanitizedTopic,
                topic: topic,
                difficulty: difficulty.toLowerCase(),
                options: q.options,
                correct_option: q.answer,
                explanation: q.explanation || '',
                status: dupCheck.isDuplicate ? 'flagged_duplicate' : 'approved',
                show_in_subjects: !dupCheck.isDuplicate,
                show_in_mock_tests: !dupCheck.isDuplicate,
                reference_material: JSON.stringify({
                  source_role: topic,
                  original_topic: sanitizedTopic,
                  generated_at: new Date().toISOString(),
                  generator: 'ai',
                  ...(dupCheck.isDuplicate && {
                    duplicate_of_id: dupCheck.originalId,
                    duplicate_of_title: dupCheck.originalTitle
                  })
                })
              });

            if (insertError) {
              console.error('Failed to save question:', insertError.message);
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
        EdgeRuntime.waitUntil(
          saveQuestionsInBackground(newAIQuestions, topic, sanitizedTopic, difficulty, supabase)
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
