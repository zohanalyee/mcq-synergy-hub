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
// `gemini-flash-latest` is the only id currently served to our keys; the dated
// ids below are kept as trailing fallbacks in case a key is pinned to them.
const DEFAULT_MODEL = "gemini-flash-latest";

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
  /**
   * COST GUARD. When false, the paid Lovable AI Gateway is never used: if every
   * free Gemini key fails the call throws FREE_ONLY_EXHAUSTED instead of
   * silently spending credits. Background/bulk jobs pass false.
   */
  allowPaidFallback?: boolean;
}

/**
 * SINGLE SOURCE OF TRUTH for the free Gemini key rotation order:
 *   #1 GEMINI_API_KEY → #2 EXTERNAL_JOBS_GEMINI_KEY → #3 GEMINI_API_KEY_3
 * Paid Lovable Gateway is only ever tried after all of these fail (and only
 * when the caller allows paid fallback). Missing/blank keys are skipped, so a
 * key that is not configured simply shortens the chain.
 */
export function getFreeGeminiKeys(): { key: string; index: number }[] {
  return [
    Deno.env.get('GEMINI_API_KEY'),
    Deno.env.get('EXTERNAL_JOBS_GEMINI_KEY'),
    Deno.env.get('GEMINI_API_KEY_3'),
  ]
    .map((key, index) => ({ key, index }))
    .filter((k): k is { key: string; index: number } => !!k.key && k.key.trim().length > 0);
}



/**
 * HARD DAILY PAID CEILING.
 * Counts today's successful paid (Lovable Gateway) calls and compares them with
 * the ceiling stored in system_settings → `paid_ai_daily_ceiling`
 * ({ enabled, max_paid_calls_per_day }). Default 500/day. Cached in-isolate for
 * 60s so the check never adds meaningful latency to learner requests.
 * Fails OPEN on any error: a broken counter must never block real students.
 */
const DEFAULT_PAID_DAILY_CEILING = 500;
let paidCeilingCache: { day: string; used: number; limit: number; enabled: boolean; at: number } | null = null;

export async function checkPaidDailyCeiling(
  client: any,
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const day = new Date().toISOString().slice(0, 10);
  if (!client) return { allowed: true, used: 0, limit: DEFAULT_PAID_DAILY_CEILING };

  try {
    if (paidCeilingCache && paidCeilingCache.day === day && Date.now() - paidCeilingCache.at < 60_000) {
      const c = paidCeilingCache;
      return { allowed: !c.enabled || c.used < c.limit, used: c.used, limit: c.limit };
    }

    const { data: settingRow } = await client
      .from('system_settings')
      .select('value')
      .eq('key', 'paid_ai_daily_ceiling')
      .maybeSingle();

    const cfg = settingRow?.value ?? {};
    const enabled = cfg?.enabled !== false;
    const limit = Number(cfg?.max_paid_calls_per_day) > 0
      ? Number(cfg.max_paid_calls_per_day)
      : DEFAULT_PAID_DAILY_CEILING;

    const { count } = await client
      .from('ai_usage_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${day}T00:00:00Z`)
      .eq('metadata->>provider', 'lovable')
      .eq('metadata->>outcome', 'success');

    const used = count || 0;
    paidCeilingCache = { day, used, limit, enabled, at: Date.now() };
    return { allowed: !enabled || used < limit, used, limit };
  } catch (error) {
    console.warn('[AI-Switch] Paid ceiling check failed (failing open):', String(error).substring(0, 120));
    return { allowed: true, used: 0, limit: DEFAULT_PAID_DAILY_CEILING };
  }
}

/**
 * AUTO-FILL PAID BUDGET.
 * Background filling gets a small, separate paid allowance so it never stops
 * completely when every free key is exhausted, and can never eat the much larger
 * learner-facing ceiling. Reads `system_settings` → `auto_fill_paid_budget`
 * ({ enabled, max_paid_calls_per_run, max_paid_calls_per_day }).
 * Fails CLOSED (0 paid calls) on error — background work is never urgent.
 */
export async function checkAutoFillPaidBudget(
  client: any,
): Promise<{ allowedThisRun: number; usedToday: number; dailyLimit: number; enabled: boolean }> {
  const empty = { allowedThisRun: 0, usedToday: 0, dailyLimit: 0, enabled: false };
  if (!client) return empty;

  try {
    const { data: row } = await client
      .from('system_settings')
      .select('value')
      .eq('key', 'auto_fill_paid_budget')
      .maybeSingle();

    const cfg = row?.value ?? {};
    const enabled = cfg?.enabled === true;
    const perRun = Math.max(0, Number(cfg?.max_paid_calls_per_run) || 0);
    const perDay = Math.max(0, Number(cfg?.max_paid_calls_per_day) || 0);
    if (!enabled || perRun === 0 || perDay === 0) return { ...empty, dailyLimit: perDay, enabled };

    const day = new Date().toISOString().slice(0, 10);
    const { count } = await client
      .from('ai_usage_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${day}T00:00:00Z`)
      .eq('metadata->>provider', 'lovable')
      .eq('metadata->>outcome', 'success')
      .eq('metadata->>source', 'auto_fill');

    const usedToday = count || 0;
    const remainingToday = Math.max(0, perDay - usedToday);
    return {
      allowedThisRun: Math.min(perRun, remainingToday),
      usedToday,
      dailyLimit: perDay,
      enabled,
    };
  } catch (error) {
    console.warn('[AI-Switch] Auto-fill paid budget check failed (failing closed):', String(error).substring(0, 120));
    return empty;
  }
}

/**
 * FREE-KEY HEALTH PROBE (quota-aware, cached).
 * A probe is a REAL Gemini request and therefore spends free-tier quota, so we
 * never probe a key we already know is down:
 *  - 429 (daily/RPM quota) → key parked until the next Google free-tier reset
 *    boundary (~08:00 UTC, midnight US-Pacific).
 *  - 401/403/400/404 → parked for 30 minutes (long enough to stop hammering,
 *    short enough that replacing a secret recovers quickly).
 *  - healthy → cached for 6 hours.
 * The cache lives in `system_settings` → `free_key_health` so it survives edge
 * isolate restarts. Cache read/write failures degrade to a live probe.
 */
export interface FreeKeyProbeDetail {
  key_index: number;
  ok: boolean;
  status: number;
  reason?: string;
  no_model_available?: boolean;
  cached?: boolean;
}

const HEALTHY_CACHE_MS = 6 * 60 * 60 * 1000;
const AUTH_COOLDOWN_MS = 30 * 60 * 1000;

// Next ~08:00 UTC boundary (midnight US-Pacific, when free-tier RPD resets).
function nextFreeTierReset(now = new Date()): number {
  const reset = new Date(now);
  reset.setUTCHours(8, 0, 0, 0);
  if (reset.getTime() <= now.getTime()) reset.setUTCDate(reset.getUTCDate() + 1);
  return reset.getTime();
}

type CachedKeyHealth = Record<string, {
  ok: boolean;
  status: number;
  reason?: string;
  no_model_available?: boolean;
  checked_at: number;
  cooldown_until?: number;
}>;

async function readKeyHealthCache(client: any): Promise<CachedKeyHealth> {
  if (!client) return {};
  try {
    const { data } = await client
      .from('system_settings')
      .select('value')
      .eq('key', 'free_key_health')
      .maybeSingle();
    return (data?.value?.keys ?? {}) as CachedKeyHealth;
  } catch (_e) {
    return {};
  }
}

async function writeKeyHealthCache(client: any, keys: CachedKeyHealth): Promise<void> {
  if (!client) return;
  try {
    await client
      .from('system_settings')
      .upsert(
        { key: 'free_key_health', value: { keys, updated_at: new Date().toISOString() } },
        { onConflict: 'key' },
      );
  } catch (error) {
    console.warn('[Gemini] Could not persist free_key_health:', String(error).substring(0, 120));
  }
}

export async function probeFreeGeminiKeys(client?: any): Promise<{
  usable: number;
  total: number;
  no_model_available: boolean;
  probe_calls: number;
  details: FreeKeyProbeDetail[];
}> {
  const keys = getFreeGeminiKeys();
  const logClient = client ?? getLogClient();
  const cache = await readKeyHealthCache(logClient);
  const now = Date.now();

  const details: FreeKeyProbeDetail[] = [];
  let usable = 0;
  let noModel = 0;
  let probeCalls = 0;
  let cacheDirty = false;

  for (const { key, index } of keys) {
    const cached = cache[String(index)];

    // 1) Known-bad key still inside its cooldown → do NOT spend quota probing.
    if (cached && !cached.ok && cached.cooldown_until && cached.cooldown_until > now) {
      if (cached.no_model_available) noModel++;
      details.push({
        key_index: index,
        ok: false,
        status: cached.status,
        reason: `cached: ${cached.reason ?? 'unusable'}`,
        no_model_available: cached.no_model_available,
        cached: true,
      });
      continue;
    }

    // 2) Recently healthy → trust it for 6 hours.
    if (cached && cached.ok && now - cached.checked_at < HEALTHY_CACHE_MS) {
      usable++;
      details.push({ key_index: index, ok: true, status: 200, reason: 'cached: healthy', cached: true });
      continue;
    }

    // 3) Otherwise spend exactly one probe request.
    try {
      // Reasoning-capable models spend tokens on internal thinking, so the probe
      // needs real output room — a tiny cap comes back textless and used to be
      // mis-read as a dead key.
      probeCalls++;
      await callGeminiText(key, '', 'Reply with the single word: ok', {
        temperature: 0,
        maxOutputTokens: 256,
      });
      usable++;
      details.push({ key_index: index, ok: true, status: 200 });
      cache[String(index)] = { ok: true, status: 200, checked_at: now };
      cacheDirty = true;
    } catch (error: any) {
      const status = Number(error?.status ?? 0);
      const reason = String(error?.message || '').substring(0, 120);

      // Classify by HTTP status, not by whether text came back.
      // Unusable ONLY for auth / quota / bad-request failures. A 404 means every
      // known model id was rejected for this key (model retirement, not a dead
      // key) — surfaced separately. Anything else (5xx overload, empty body,
      // network blip) means the key authenticated fine, so keep it usable.
      const isQuota = status === 429;
      const isAuthOrBad = status === 401 || status === 403 || status === 400;
      const isNoModel = status === 404;

      if (isNoModel) noModel++;

      if (isQuota || isAuthOrBad || isNoModel) {
        details.push({ key_index: index, ok: false, status, reason, no_model_available: isNoModel });
        cache[String(index)] = {
          ok: false,
          status,
          reason,
          no_model_available: isNoModel,
          checked_at: now,
          cooldown_until: isQuota ? nextFreeTierReset() : now + AUTH_COOLDOWN_MS,
        };
        cacheDirty = true;
      } else {
        usable++;
        details.push({
          key_index: index,
          ok: true,
          status: status || 200,
          reason: `treated as usable (transient): ${reason}`,
        });
        // Transient failure: don't cache a verdict either way.
        delete cache[String(index)];
        cacheDirty = true;
      }
    }
  }

  if (cacheDirty) await writeKeyHealthCache(logClient, cache);

  return {
    usable,
    total: keys.length,
    no_model_available: keys.length > 0 && noModel === keys.length,
    probe_calls: probeCalls,
    details,
  };
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
// Model fallback chain: if a model id is retired / unavailable for the key
// (Google answers 404 "model not found for API version"), retry the same
// request on the next known-good model instead of failing the whole run.
const TEXT_MODEL_FALLBACKS = ["gemini-flash-latest", "gemini-2.0-flash", "gemini-2.5-flash"];

export async function callGeminiText(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  config: GeminiConfig = {}
): Promise<string> {
  const primary = config.model || DEFAULT_MODEL;
  const models = [primary, ...TEXT_MODEL_FALLBACKS.filter((m) => m !== primary)];

  let lastError: any = null;
  for (const model of models) {
    try {
      return await callGeminiTextOnce(apiKey, systemPrompt, userPrompt, config, model);
    } catch (error: any) {
      lastError = error;
      // Only a missing/unsupported model is worth retrying on another model.
      if (error?.status === 404) {
        console.warn(`[Gemini] Model ${model} unavailable (404) — trying next model...`);
        continue;
      }
      throw error;
    }
  }
  throw lastError ?? createGeminiError("Gemini API error: no model available", 404);
}

async function callGeminiTextOnce(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  config: GeminiConfig,
  model: string
): Promise<string> {
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

  // Free key rotation: #1 → #2 → #3 (shared order), paid gateway last.
  const geminiKeys = getFreeGeminiKeys();


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

  // COST GUARD 2: hard daily ceiling on PAID gateway calls across the whole
  // app (learner-facing included). Free keys are always tried first above, so
  // this only ever blocks paid top-ups once the day's ceiling is reached.
  if (logCtx?.allowPaidFallback !== false && lovableKey) {
    const ceiling = await checkPaidDailyCeiling(client);
    if (!ceiling.allowed) {
      console.warn(`[AI-Switch] 🚫 Paid daily ceiling reached (${ceiling.used}/${ceiling.limit}) — refusing paid call`);
      await record('none', -1, 'paid_daily_ceiling_reached', 429);
      throw createCodedError(
        `PAID_DAILY_CEILING: daily paid AI ceiling reached (${ceiling.used}/${ceiling.limit}). Resets at midnight UTC.`,
        429,
        'PAID_DAILY_CEILING',
      );
    }
  }

  // COST GUARD: callers that opt out of paid usage stop here instead of
  // silently burning credits when the free keys are down.
  if (logCtx?.allowPaidFallback === false) {
    console.warn('[AI-Switch] 🚫 Paid fallback disabled for this caller — skipping Lovable Gateway');
    await record('none', -1, 'free_only_exhausted', 429);
    throw createCodedError(
      'FREE_ONLY_EXHAUSTED: no usable free Gemini key and paid fallback is disabled for this caller.',
      429,
      'FREE_ONLY_EXHAUSTED',
    );
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
  config: GeminiConfig = {},
  logCtx?: AILogContext
): Promise<AutoSwitchResult> {
  checkDailyReset();

  const client = logCtx?.supabaseClient ?? getLogClient();
  const sourceType = logCtx?.sourceType ?? 'vision';
  // Vision rotates the same free keys (#1 → #2 → #3); no paid fallback exists.
  const keys = getFreeGeminiKeys();


  for (let i = 0; i < keys.length; i++) {
    const { key, index } = keys[i];
    const isLast = i === keys.length - 1;
    const label = `key #${index + 1}`;
    try {
      console.log(`[AI-Switch] Attempting Gemini Vision (${label})...`);
      await waitForRateLimit();
      const text = await callGeminiVision(key, prompt, base64Data, mimeType, config);
      console.log(`[AI-Switch] ✅ Vision success with ${label}`);
      await recordAIAttempt(client, { provider: 'gemini', key_index: index, outcome: 'success', status: 200, source_type: sourceType });
      return { text, provider: 'gemini', cost: 0 };
    } catch (error: any) {
      if (isQuotaError(error)) {
        console.warn(`[AI-Switch] ⚠️ Vision rate limited on ${label}, trying next...`);
        await recordAIAttempt(client, { provider: 'gemini', key_index: index, outcome: 'rate_limited', status: 429, source_type: sourceType });
        continue;
      }
      console.error(`[AI-Switch] Vision error on ${label}:`, error.message?.substring(0, 100));
      await recordAIAttempt(client, { provider: 'gemini', key_index: index, outcome: 'error', status: error?.status ?? 0, source_type: sourceType });
      if (!isLast) continue;
      throw error;
    }
  }


  throw new Error('All Gemini Vision keys exhausted. Vision does not support Lovable Gateway fallback.');
}



// ============= EMBEDDINGS (shared helper) =============
// Gemini embedding call with key rotation + quota-logging. Lovable Gateway
// does NOT expose an embedContent-equivalent, so there is no paid fallback.
// This helper exists so every embedding call is logged into ai_usage_logs
// (via recordAIAttempt), matching the visibility that callAIWithAutoSwitch
// gives text generation. Never call the Gemini embedContent endpoint directly
// from an edge function — always go through this helper.
const EMBEDDING_MODELS_DEFAULT = ["gemini-embedding-001", "text-embedding-005", "text-embedding-004"];

export async function callGeminiEmbedding(
  text: string,
  options: { outputDimensionality?: number; models?: string[]; logCtx?: AILogContext } = {}
): Promise<number[]> {
  const models = options.models ?? EMBEDDING_MODELS_DEFAULT;
  const outputDimensionality = options.outputDimensionality ?? 768;
  const client = options.logCtx?.supabaseClient ?? getLogClient();
  const sourceType = options.logCtx?.sourceType ?? 'embedding';
  const record = (provider: 'gemini' | 'none', key_index: number, outcome: string, status: number) =>
    recordAIAttempt(client, { provider, key_index, outcome, status, source_type: sourceType });

  const keys = getFreeGeminiKeys();


  if (keys.length === 0) {
    await record('none', -1, 'no_key', 0);
    throw new Error('GEMINI_API_KEY is not configured (embeddings require a Gemini key)');
  }

  let lastStatus = 0;
  let lastError = '';

  for (const { key, index } of keys) {
    for (const model of models) {
      try {
        const response = await fetch(
          `${GEMINI_API_BASE}/${model}:embedContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: `models/${model}`,
              content: { parts: [{ text }] },
              outputDimensionality,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.embedding?.values) {
            await record('gemini', index, 'success', 200);
            return data.embedding.values;
          }
          lastError = 'empty embedding response';
          continue;
        }

        lastStatus = response.status;
        lastError = await response.text();

        if (response.status === 404) {
          // Model not available on this key — try next model
          continue;
        }
        if (response.status === 429) {
          await record('gemini', index, 'rate_limited', 429);
          break; // try next key
        }
        if (response.status === 401 || response.status === 403) {
          await record('gemini', index, 'auth_error', response.status);
          break; // try next key
        }
        await record('gemini', index, 'error', response.status);
      } catch (e: any) {
        lastError = e?.message ?? String(e);
        await record('gemini', index, 'error', 0);
      }
    }
  }

  throw new Error(`Embedding failed on all keys/models (last status ${lastStatus}): ${lastError.substring(0, 200)}`);
}

