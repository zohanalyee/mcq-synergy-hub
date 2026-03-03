// Shared Gemini API helper — Direct calls to Google's Generative AI API
// Replaces Lovable AI Gateway to use free-tier Gemini API directly

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.0-flash";

const DEFAULT_SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
];

interface GeminiConfig {
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
}

function extractText(result: any): string {
  return result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

function createGeminiError(message: string, status: number): Error {
  const err = new Error(message);
  (err as any).status = status;
  return err;
}

/**
 * Call Gemini for text-only generation.
 * System prompt is simulated via a user→model turn pair.
 */
export async function callGeminiText(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  config: GeminiConfig = {}
): Promise<string> {
  const model = config.model || DEFAULT_MODEL;
  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  const contents: any[] = [];

  if (systemPrompt) {
    contents.push({ role: "user", parts: [{ text: systemPrompt }] });
    contents.push({ role: "model", parts: [{ text: "Understood. I will follow these instructions." }] });
  }

  contents.push({ role: "user", parts: [{ text: userPrompt }] });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: config.temperature ?? 0.7,
        maxOutputTokens: config.maxOutputTokens ?? 8192,
      },
      safetySettings: DEFAULT_SAFETY_SETTINGS,
    }),
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

/**
 * Call Gemini with vision/PDF input (inlineData).
 */
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
