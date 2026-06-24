// Shared Gemini API helper with Auto-Switcher (Gemini Free → Lovable Gateway Fallback)

import { recordAIAttempt } from './quotaManager.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Lazy service-role client used ONLY for logging AI attempt outcomes, so deep
// call stacks don't need to thread a client through. Safe no-op if env missing.
let _logClient: any | null = null;
let _logClientResolved = false;
function getLogClient(): any | null {
  if (_logClientResolved) return _logClient;
  _logClientResolved = true;
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    _logClient = url && key ? createClient(url, key) : null;
  } catch (_e) {
    _logClient = null;
  }
  return _logClient;
}



const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const LOVABLE_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "gemini-2.0-flash";

const DEFAULT_SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
];

export interface GeminiConfig {
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
}

export interface AutoSwitchResult {
  text: string;
  provider: 'gemini' | 'lovable';
  cost: number;
  keyIndex?: number;
}

// Optional logging context so the auto-switcher records every terminal
// attempt outcome (success or failure) into ai_usage_logs for diagnosability.
export interface AILogContext {
  supabaseClient: any;
  sourceType?: string;
}


// ============= PROVIDER STATE (in-memory, per isolate) =============
interface ProviderStatus {
  available: boolean;
  lastError?: string;
  lastChecked: number;
}

const providers: Record<string, ProviderStatus> = {
  gemini: { available: true, lastChecked: 0 },
  lovable: { available: true, lastChecked: 0 },
};

// ============= RATE LIMITER =============
const RATE_LIMIT_DELAY = 4000; // 4 seconds between Gemini calls
let lastGeminiCallTime = 0;

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastGeminiCallTime;
  if (elapsed < RATE_LIMIT_DELAY && lastGeminiCallTime > 0) {
    const wait = RATE_LIMIT_DELAY - elapsed;
    console.log(`[AI-Switch] Rate limit: waiting ${wait}ms`);
    await new Promise(resolve => setTimeout(resolve, wait));
  }
  lastGeminiCallTime = Date.now();
}

// ============= DAILY RESET =============
function checkDailyReset(): void {
  const now = new Date();
  if (providers.gemini.lastChecked > 0) {
    const lastCheck = new Date(providers.gemini.lastChecked);
    if (now.getUTCDate() !== lastCheck.getUTCDate() || now.getUTCMonth() !== lastCheck.getUTCMonth()) {
      console.log('[AI-Switch] 🔄 New UTC day — resetting Gemini availability');
      providers.gemini.available = true;
      providers.gemini.lastError = undefined;
    }
  }
}

// ============= QUOTA ERROR DETECTION =============
function isQuotaError(error: any): boolean {
  const msg = String(error?.message || '').toLowerCase();
  return (
    error?.status === 429 ||
    error?.statusCode === 429 ||
    msg.includes('429') ||
    msg.includes('rate_limit') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('gemini_rate_limit')
  );
}

function extractText(result: any): string {
  return result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

function createGeminiError(message: string, status: number): Error {
  const err = new Error(message);
  (err as any).status = status;
  return err;
}

// Coded errors so callers/logs can distinguish failure types.
function createCodedError(message: string, status: number, code: string): Error {
  const err = new Error(message);
  (err as any).status = status;
  (err as any).code = code;
  return err;
}

function isAuthError(error: any): boolean {
  const s = error?.status ?? error?.statusCode;
  const msg = String(error?.message || '').toLowerCase();
  return s === 401 || s === 403 || msg.includes('auth_error') || msg.includes('unauthorized');
}

function isCreditsError(error: any): boolean {
  const s = error?.status ?? error?.statusCode;
  const msg = String(error?.message || '');
  return s === 402 || msg.includes('402');
}


// ============= DIRECT GEMINI TEXT CALL =============
export async function callGeminiText(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  config: GeminiConfig = {}
): Promise<string> {
  const model = config.model || DEFAULT_MODEL;
  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  // Phase 6 — use Gemini's native systemInstruction field for grounding instead
  // of faking a user/model turn. This improves instruction adherence (Pakistan
  // syllabus grounding, exam style) AND trims the boilerplate "Understood..."
  // round-trip tokens. Quality is preserved/improved — not reduced.
  const contents: any[] = [
    { role: "user", parts: [{ text: userPrompt }] },
  ];

  const requestBody: any = {
    contents,
    generationConfig: {
      temperature: config.temperature ?? 0.7,
      maxOutputTokens: config.maxOutputTokens ?? 8192,
    },
    safetySettings: DEFAULT_SAFETY_SETTINGS,
  };
  if (systemPrompt) {
    requestBody.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 429) {
      throw createGeminiError("GEMINI_RATE_LIMIT: Rate limit exceeded. Please try again later.", 429);
    }
    if (response.status === 403 || response.status === 401) {
      throw createGeminiError("GEMINI_AUTH_ERROR: API key invalid or unauthorized.", response.status);
    }
    throw createGeminiError(`Gemini API error: ${response.status} - ${errText.substring(0, 300)}`, response.status);
  }

  const data = await response.json();
  const text = extractText(data);
  if (!text) {
    throw new Error("Gemini returned empty response");
  }
  return text;
}

// ============= DIRECT GEMINI VISION CALL =============
export async function callGeminiVision(
  apiKey: string,
  prompt: string,
  base64Data: string,
  mimeType: string,
  config: GeminiConfig = {}
): Promise<string> {
  const model = config.model || DEFAULT_MODEL;
  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: base64Data } },
        ],
      }],
      generationConfig: {
        temperature: config.temperature ?? 0.1,
        maxOutputTokens: config.maxOutputTokens ?? 16384,
      },
      safetySettings: DEFAULT_SAFETY_SETTINGS,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 429) {
      throw createGeminiError("GEMINI_RATE_LIMIT: Rate limit exceeded.", 429);
    }
    throw createGeminiError(`Gemini Vision error: ${response.status} - ${errText.substring(0, 300)}`, response.status);
  }

  const data = await response.json();
  return extractText(data);
}

// ============= LOVABLE GATEWAY CALL =============
async function callLovableGateway(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  config: GeminiConfig = {}
): Promise<string> {
  const messages: any[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userPrompt });

  const response = await fetch(LOVABLE_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages,
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxOutputTokens ?? 8192,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw createGeminiError(`Lovable Gateway error: ${response.status} - ${errText.substring(0, 300)}`, response.status);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("Lovable Gateway returned empty response");
  }
  return text;
}

// ============= AUTO-SWITCHER: TEXT =============
export async function callAIWithAutoSwitch(
  systemPrompt: string,
  userPrompt: string,
  config: GeminiConfig = {},
  logCtx?: AILogContext
): Promise<AutoSwitchResult> {
  checkDailyReset();

  const sourceType = logCtx?.sourceType;
  const client = logCtx?.supabaseClient ?? getLogClient();
  const record = (provider: 'gemini' | 'lovable' | 'none', key_index: number, outcome: string, status: number) =>
    recordAIAttempt(client, { provider, key_index, outcome, status, source_type: sourceType });

  // Build the Gemini key rotation: primary + secondary (already used by vision).
  const geminiKeys = [
    Deno.env.get('GEMINI_API_KEY'),
    Deno.env.get('EXTERNAL_JOBS_GEMINI_KEY'),
  ]
    .map((key, index) => ({ key, index }))
    .filter((k): k is { key: string; index: number } => !!k.key && k.key.trim().length > 0);

  const lovableKey = Deno.env.get('LOVABLE_API_KEY');

  let anyGeminiRateLimited = false;

  // Try every Gemini key once. Returns a result on success, or null if all failed.
  const tryGeminiKeys = async (): Promise<AutoSwitchResult | null> => {
    for (const { key, index } of geminiKeys) {
      try {
        console.log(`[AI-Switch] Attempting Gemini (key #${index + 1})...`);
        await waitForRateLimit();
        const text = await callGeminiText(key, systemPrompt, userPrompt, config);
        console.log(`[AI-Switch] ✅ Gemini success via key #${index + 1} (cost: $0)`);
        await record('gemini', index, 'success', 200);
        return { text, provider: 'gemini', cost: 0, keyIndex: index };
      } catch (error: any) {
        if (isQuotaError(error)) {
          anyGeminiRateLimited = true;
          console.warn(`[AI-Switch] ⚠️ Gemini key #${index + 1} rate limited (429), trying next...`);
          await record('gemini', index, 'rate_limited', 429);
          continue;
        }
        if (isAuthError(error)) {
          console.error(`[AI-Switch] Gemini key #${index + 1} auth error, trying next...`);
          await record('gemini', index, 'auth_error', 403);
          continue;
        }
        console.error(`[AI-Switch] Gemini key #${index + 1} error:`, error.message?.substring(0, 100));
        await record('gemini', index, 'error', error?.status ?? 0);
      }
    }
    return null;
  };

  // PRIMARY: direct Gemini (FREE) with key rotation
  if (geminiKeys.length > 0 && providers.gemini.available) {
    const res = await tryGeminiKeys();
    if (res) return res;

    // All keys failed this pass. If it was rate limiting, Gemini per-minute
    // limits clear quickly — back off once and retry the whole rotation before
    // burning paid Gateway credits.
    if (anyGeminiRateLimited) {
      console.warn('[AI-Switch] ⏳ All Gemini keys 429 — backing off 8s before one retry...');
      await new Promise((r) => setTimeout(r, 8000));
      anyGeminiRateLimited = false;
      const retryRes = await tryGeminiKeys();
      if (retryRes) return retryRes;

      // Still exhausted — mark unavailable for the rest of this isolate so we
      // don't keep hammering Gemini, and fall through to the Gateway.
      providers.gemini.available = false;
      providers.gemini.lastError = 'All keys quota exhausted - resets at midnight UTC';
      providers.gemini.lastChecked = Date.now();
    }
  } else if (geminiKeys.length === 0) {
    console.warn('[AI-Switch] No Gemini keys configured');
  } else {
    console.log('[AI-Switch] Gemini marked unavailable, skipping to Lovable...');
  }

  // FALLBACK: Lovable AI Gateway (PAID) with bounded retry/backoff.
  // Retry only transient failures (429 / 5xx). 400 and 402 are terminal.
  if (lovableKey) {
    const gatewayDelays = [0, 2000, 6000]; // initial attempt + 2 retries
    for (let i = 0; i < gatewayDelays.length; i++) {
      if (gatewayDelays[i] > 0) {
        console.log(`[AI-Switch] ⏳ Gateway retry ${i}/${gatewayDelays.length - 1} after ${gatewayDelays[i]}ms`);
        await new Promise((r) => setTimeout(r, gatewayDelays[i]));
      }
      try {
        console.log('[AI-Switch] 🔄 Using Lovable AI Gateway (paid backup)...');
        const text = await callLovableGateway(lovableKey, systemPrompt, userPrompt, config);
        console.log('[AI-Switch] ✅ Lovable success (using paid credits)');
        await record('lovable', -1, 'success', 200);
        return { text, provider: 'lovable', cost: 1, keyIndex: -1 };
      } catch (error: any) {
        const status = error?.status ?? error?.statusCode ?? 0;

        if (isCreditsError(error)) {
          console.error('[AI-Switch] ❌ Gateway credits exhausted (402)');
          await record('lovable', -1, 'credits_exhausted', 402);
          throw createCodedError('CREDITS_EXHAUSTED: Lovable AI credits exhausted.', 402, 'CREDITS_EXHAUSTED');
        }
        if (status === 400) {
          console.error('[AI-Switch] ❌ Gateway bad request (400):', error.message?.substring(0, 120));
          await record('lovable', -1, 'bad_request', 400);
          throw createCodedError(`GATEWAY_BAD_REQUEST: ${error.message}`, 400, 'GATEWAY_BAD_REQUEST');
        }

        const retryable = status === 429 || status >= 500 || status === 0;
        console.error(`[AI-Switch] ❌ Gateway error (status ${status}):`, error.message?.substring(0, 100));
        if (retryable && i < gatewayDelays.length - 1) {
          continue; // back off and retry
        }

        if (status === 429) {
          await record('lovable', -1, 'rate_limited', 429);
          throw createCodedError('GATEWAY_RATE_LIMIT: Lovable AI Gateway rate limit exceeded.', 429, 'GATEWAY_RATE_LIMIT');
        }
        await record('lovable', -1, 'error', status);
        throw createCodedError(`ALL_PROVIDERS_FAILED: ${error.message}`, status || 503, 'ALL_PROVIDERS_FAILED');
      }
    }
  } else {
    console.warn('[AI-Switch] LOVABLE_API_KEY not configured — no backup available');
  }

  // Reached only when there is no Gateway key configured and Gemini failed.
  await record('none', -1, 'all_failed', 429);
  throw createCodedError(
    `GEMINI_RATE_LIMIT: All Gemini keys exhausted and no backup configured. ${providers.gemini.lastError || ''}`.trim(),
    429,
    'GEMINI_RATE_LIMIT'
  );
}


// ============= AUTO-SWITCHER: VISION =============
// Vision uses inline PDF data — Lovable Gateway doesn't support this.
// Falls back to EXTERNAL_JOBS_GEMINI_KEY if primary key fails.
export async function callVisionWithAutoSwitch(
  prompt: string,
  base64Data: string,
  mimeType: string,
  config: GeminiConfig = {}
): Promise<AutoSwitchResult> {
  checkDailyReset();

  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  const fallbackKey = Deno.env.get('EXTERNAL_JOBS_GEMINI_KEY');
  const keysToTry = [geminiKey, fallbackKey].filter((k): k is string => !!k && k.trim().length > 0);

  for (const key of keysToTry) {
    const label = key === geminiKey ? 'primary' : 'fallback';
    try {
      console.log(`[AI-Switch] Attempting Gemini Vision (${label} key)...`);
      await waitForRateLimit();
      const text = await callGeminiVision(key, prompt, base64Data, mimeType, config);
      console.log(`[AI-Switch] ✅ Vision success with ${label} key`);
      return { text, provider: 'gemini', cost: 0 };
    } catch (error: any) {
      if (isQuotaError(error)) {
        console.warn(`[AI-Switch] ⚠️ Vision rate limited on ${label} key, trying next...`);
        continue;
      }
      console.error(`[AI-Switch] Vision error on ${label} key:`, error.message?.substring(0, 100));
      if (label === 'primary' && fallbackKey) continue; // Try fallback
      throw error;
    }
  }

  throw new Error('All Gemini Vision keys exhausted. Vision does not support Lovable Gateway fallback.');
}
