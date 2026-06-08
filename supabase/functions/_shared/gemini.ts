// Shared Gemini API helper with Auto-Switcher (Gemini Free → Lovable Gateway Fallback)

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
  config: GeminiConfig = {}
): Promise<AutoSwitchResult> {
  checkDailyReset();

  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');

  // TRY PRIMARY: Direct Gemini (FREE)
  if (providers.gemini.available && geminiKey) {
    try {
      console.log('[AI-Switch] Attempting Gemini (free tier)...');
      await waitForRateLimit();
      const text = await callGeminiText(geminiKey, systemPrompt, userPrompt, config);
      console.log('[AI-Switch] ✅ Gemini success (cost: $0)');
      return { text, provider: 'gemini', cost: 0 };
    } catch (error: any) {
      if (isQuotaError(error)) {
        console.warn('[AI-Switch] ⚠️ Gemini quota exhausted. Switching to Lovable backup...');
        providers.gemini.available = false;
        providers.gemini.lastError = 'Quota exhausted - resets at midnight UTC';
        providers.gemini.lastChecked = Date.now();
        // Fall through to Lovable
      } else {
        // Non-quota error — still try Lovable as fallback
        console.error('[AI-Switch] Gemini non-quota error:', error.message?.substring(0, 100));
        // Fall through to Lovable
      }
    }
  } else if (!geminiKey) {
    console.warn('[AI-Switch] GEMINI_API_KEY not configured');
  } else {
    console.log('[AI-Switch] Gemini marked unavailable, skipping to Lovable...');
  }

  // FALLBACK: Lovable AI Gateway (PAID)
  if (lovableKey) {
    try {
      console.log('[AI-Switch] 🔄 Using Lovable AI Gateway (paid backup)...');
      const text = await callLovableGateway(lovableKey, systemPrompt, userPrompt, config);
      console.log('[AI-Switch] ✅ Lovable success (using paid credits)');
      return { text, provider: 'lovable', cost: 1 };
    } catch (error: any) {
      console.error('[AI-Switch] ❌ Lovable backup also failed:', error.message?.substring(0, 100));
      throw error;
    }
  } else {
    console.warn('[AI-Switch] LOVABLE_API_KEY not configured — no backup available');
  }

  throw new Error(
    'All AI providers unavailable. ' +
    `Gemini: ${providers.gemini.lastError || 'not configured'}. ` +
    `Lovable: ${providers.lovable.lastError || 'not configured'}.`
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
