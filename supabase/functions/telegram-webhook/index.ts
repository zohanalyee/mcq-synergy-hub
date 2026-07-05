import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAIWithAutoSwitch, callVisionWithAutoSwitch } from '../_shared/gemini.ts';
import { mailtoForApplyUrl, isEmail } from '../_shared/sanitize.ts';
import { Image } from 'https://deno.land/x/imagescript@1.2.17/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token',
};

const TELEGRAM_API = 'https://api.telegram.org';
const IMAGE_BUCKET = 'opportunity-images';
const SIGNED_URL_TTL = 315360000; // ~10 years — long-lived (bucket is private)
const MEDIA_GROUP_DEBOUNCE_MS = 5000;

// ---------- Telegram helpers ----------
async function tgSendMessage(botToken: string, chatId: number | string, text: string) {
  try {
    await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
  } catch (e) {
    console.error('[Telegram] sendMessage failed:', (e as Error).message);
  }
}

function bytesToBase64(buf: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) {
    binary += String.fromCharCode(...buf.subarray(i, i + chunk));
  }
  return btoa(binary);
}

// Download a Telegram file, returning its raw bytes + inferred mime/ext.
async function tgGetFileBytes(
  botToken: string,
  fileId: string,
): Promise<{ bytes: Uint8Array; mime: string; ext: string } | null> {
  try {
    const infoRes = await fetch(`${TELEGRAM_API}/bot${botToken}/getFile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: fileId }),
    });
    const info = await infoRes.json();
    const filePath = info?.result?.file_path;
    if (!filePath) return null;

    const fileRes = await fetch(`${TELEGRAM_API}/file/bot${botToken}/${filePath}`);
    if (!fileRes.ok) return null;
    const bytes = new Uint8Array(await fileRes.arrayBuffer());

    const lower = filePath.toLowerCase();
    let ext = 'jpg';
    let mime = 'image/jpeg';
    if (lower.endsWith('.png')) { ext = 'png'; mime = 'image/png'; }
    else if (lower.endsWith('.webp')) { ext = 'webp'; mime = 'image/webp'; }
    return { bytes, mime, ext };
  } catch (e) {
    console.error('[Telegram] getFile failed:', (e as Error).message);
    return null;
  }
}

// ---------- OCR (handles tall/long images via vertical chunking) ----------
const OCR_PROMPT =
  'Extract ALL readable text from this job/scholarship/tender advertisement image. ' +
  'Return only the raw text, preserving line breaks and reading order top-to-bottom. Do not summarize or omit anything.';

async function ocrImageBytes(bytes: Uint8Array, mime: string): Promise<string> {
  // For very tall images Gemini Vision tends to downscale and drop bottom text.
  // Split into overlapping vertical chunks and OCR each, then concatenate.
  const CHUNK_HEIGHT = 1500;
  const OVERLAP = 250;
  const MAX_CHUNKS = 6;

  let img: any = null;
  try {
    img = await Image.decode(bytes);
  } catch (e) {
    console.warn('[OCR] decode failed, sending whole image:', (e as Error).message);
  }

  // Small/undecodable images: OCR the whole thing in one call.
  if (!img || img.height <= CHUNK_HEIGHT * 1.3) {
    const res = await callVisionWithAutoSwitch(OCR_PROMPT, bytesToBase64(bytes), mime, { temperature: 0.1 });
    return res.text || '';
  }

  const parts: string[] = [];
  let y = 0;
  let count = 0;
  while (y < img.height && count < MAX_CHUNKS) {
    const h = Math.min(CHUNK_HEIGHT, img.height - y);
    try {
      const slice = img.clone().crop(0, y, img.width, h);
      const jpeg = await slice.encodeJPEG(90);
      const res = await callVisionWithAutoSwitch(OCR_PROMPT, bytesToBase64(jpeg), 'image/jpeg', { temperature: 0.1 });
      if (res.text) parts.push(res.text.trim());
    } catch (e) {
      console.error(`[OCR] chunk at y=${y} failed:`, (e as Error).message);
    }
    if (y + h >= img.height) break;
    y += CHUNK_HEIGHT - OVERLAP;
    count++;
  }
  console.log(`[OCR] Long image (${img.width}x${img.height}) processed in ${parts.length} chunk(s)`);
  return parts.join('\n');
}

// Upload image bytes to the private bucket and return a long-lived signed URL.
async function uploadOpportunityImage(
  supabase: any,
  bytes: Uint8Array,
  ext: string,
  mime: string,
): Promise<string | null> {
  try {
    const path = `telegram/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(IMAGE_BUCKET).upload(path, bytes, {
      contentType: mime,
      upsert: false,
    });
    if (upErr) {
      console.error('[Telegram] image upload failed:', upErr.message);
      return null;
    }
    const { data: signed, error: signErr } = await supabase.storage
      .from(IMAGE_BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL);
    if (signErr || !signed?.signedUrl) {
      console.error('[Telegram] signed URL failed:', signErr?.message);
      return null;
    }
    return signed.signedUrl;
  } catch (e) {
    console.error('[Telegram] uploadOpportunityImage error:', (e as Error).message);
    return null;
  }
}

// ---------- Guards / parsing ----------
const isContactInfoTitle = (value: string): boolean => {
  const v = (value || '').trim().toLowerCase();
  if (!v) return false;
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/.test(v)) return true;
  if (/^(https?:\/\/|www\.)/.test(v)) return true;
  if (!/\s/.test(v) && /\.[a-z]{2,}(\.[a-z]{2,})?(\/.*)?$/.test(v)) return true;
  return false;
};

// Full schema-parity extraction — mirrors the "Enhance with AI Magic" prompts.
const EXTRACTION_SYSTEM = `You are an expert content curator for a Pakistani jobs, scholarships & tenders platform (mcqsai.com).
From the given advertisement text, extract clean, professional, structured data and return ONLY a valid JSON object (no markdown fence, no commentary) with EXACTLY these keys:
{
  "title": string,              // concise professional role/scholarship/tender name — NEVER an email, URL or phone number
  "type": "job"|"scholarship"|"tender",  // classify; default "job" if ambiguous
  "organization": string|null,  // hiring company / institution / procuring agency
  "description": string|null,   // DETAILED GitHub-Flavored Markdown. Use "## Overview" (2-3 sentences), "## Eligibility", "## How to Apply", "## Important Dates". If multiple posts/positions exist, output a markdown TABLE (| Post | BPS | Vacancies | Quota | Qualification |). Use bulleted lists. NEVER a wall of text.
  "deadline_date": string|null, // ISO date YYYY-MM-DD (convert Urdu/Pakistani dates); else null
  "apply_url": string|null,     // application link OR email if present; else null
  "location": string|null,      // city / province / country
  "sector": "government"|"private"|null,
  "region": "sindh"|"punjab"|"kpk"|"balochistan"|"federal"|"international"|"other"|null,
  "qualification": string|null, // required education (jobs)
  "salary": string|null,        // pay scale / salary range e.g. "BPS-17 (Rs. 57,000-115,000)"
  "experience": string|null,    // required experience
  "positions": number|null,     // number of vacancies as an integer
  "department": string|null,    // department name (jobs/tenders)
  "eligibility": string|null,   // who can apply (scholarships)
  "amount": string|null,        // scholarship value / stipend
  "field_of_study": string|null,// eligible fields (scholarships)
  "education_level": string|null,// required level (scholarships)
  "scholarship_scope": "national"|"international"|null,
  "tender_number": string|null, // official tender/reference number
  "tender_value": string|null,  // estimated cost (tenders)
  "tender_category": string|null // e.g. "Construction", "IT Services"
}
RULES:
1. Use null for anything not clearly stated. Never invent URLs, dates, salaries or numbers.
2. Clean up OCR artifacts, broken lines and extra spaces.
3. Extract EVERY field that is present — do not leave qualification/salary/experience/positions/department empty if the text mentions them.
4. The "description" VALUE is a single Markdown string with headings, bullets and tables — keep it detailed but well-structured.
5. Return raw JSON only.`;

function safeParseJson(raw: string): any | null {
  if (!raw) return null;
  let t = raw.trim();
  t = t.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const first = t.indexOf('{');
  const last = t.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return null;
  try {
    return JSON.parse(t.slice(first, last + 1));
  } catch {
    return null;
  }
}

function normalizeDate(d: any): string | null {
  if (!d || typeof d !== 'string') return null;
  const m = d.match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : null;
}

function firstEmailIn(text: string): string | null {
  const m = (text || '').match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : null;
}

function shortId(id: string): string {
  return id.slice(0, 8);
}

function pickStr(v: any): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s : null;
}

// ---------- Shared intake: extract → insert → confirm ----------
async function runIntake(
  supabase: any,
  botToken: string,
  chatId: number | string,
  messageId: number | null,
  sourceText: string,
  imageUrls: string[],
) {
  let extracted: any = null;
  try {
    const res = await callAIWithAutoSwitch(EXTRACTION_SYSTEM, sourceText, { temperature: 0.1 }, {
      supabaseClient: supabase,
      sourceType: 'telegram-intake',
    });
    extracted = safeParseJson(res.text);
  } catch (e) {
    console.error('[Telegram Webhook] extraction failed:', (e as Error).message);
    await tgSendMessage(botToken, chatId, '⚠️ AI is busy right now. Please try again in a few minutes.');
    return;
  }

  if (!extracted || !extracted.title) {
    await tgSendMessage(botToken, chatId, "⚠️ I couldn't extract a clear opportunity from that. Please resend with more detail.");
    return;
  }

  // Title sanitize
  let cleanTitle = String(extracted.title).trim();
  if (isContactInfoTitle(cleanTitle)) {
    cleanTitle =
      extracted.organization && !isContactInfoTitle(String(extracted.organization))
        ? String(extracted.organization).trim()
        : extracted.type === 'scholarship'
        ? 'Scholarship Opportunity'
        : extracted.type === 'tender'
        ? 'Tender Notice'
        : 'Job Opportunity';
  }

  const type = ['job', 'scholarship', 'tender'].includes(extracted.type) ? extracted.type : 'job';

  // Apply URL: http(s) → as-is; bare email → mailto:; else search raw text for an email.
  let applyUrl: string | null = null;
  const rawApply = pickStr(extracted.apply_url);
  if (rawApply && /^https?:\/\//i.test(rawApply)) {
    applyUrl = rawApply;
  } else if (rawApply && isEmail(rawApply)) {
    applyUrl = mailtoForApplyUrl(rawApply);
  } else {
    const email = firstEmailIn(sourceText);
    if (email) applyUrl = `mailto:${email}`;
  }

  // Dedupe against a real (non-placeholder) apply URL only
  if (applyUrl) {
    const { data: dup } = await supabase
      .from('external_opportunities')
      .select('id')
      .eq('apply_url', applyUrl)
      .maybeSingle();
    if (dup) {
      await tgSendMessage(botToken, chatId, 'ℹ️ This opportunity (same apply link) already exists.');
      return;
    }
  }

  const newId = crypto.randomUUID();
  const finalApplyUrl = applyUrl || `https://mcqsai.com/telegram-intake/${newId}`;
  const primaryImage = imageUrls[0] ?? null;
  const additionalImages = imageUrls.slice(1);

  const positions =
    extracted.positions !== null && extracted.positions !== undefined && !isNaN(parseInt(extracted.positions))
      ? parseInt(extracted.positions)
      : null;

  const insertData: Record<string, unknown> = {
    id: newId,
    title: cleanTitle.slice(0, 500),
    description: extracted.description ? String(extracted.description).slice(0, 6000) : null,
    apply_url: finalApplyUrl,
    type,
    organization: pickStr(extracted.organization),
    location: pickStr(extracted.location),
    deadline_date: normalizeDate(extracted.deadline_date),
    image_url: primaryImage,
    sector: ['government', 'private'].includes(extracted.sector) ? extracted.sector : null,
    region: ['sindh', 'punjab', 'kpk', 'balochistan', 'federal', 'international', 'other'].includes(extracted.region)
      ? extracted.region
      : null,
    scholarship_scope: ['national', 'international'].includes(extracted.scholarship_scope)
      ? extracted.scholarship_scope
      : null,
    // Job fields
    qualification: pickStr(extracted.qualification),
    salary: pickStr(extracted.salary),
    experience: pickStr(extracted.experience),
    positions,
    department: pickStr(extracted.department),
    // Scholarship fields
    eligibility: pickStr(extracted.eligibility),
    amount: pickStr(extracted.amount),
    field_of_study: pickStr(extracted.field_of_study),
    education_level: pickStr(extracted.education_level),
    // Tender fields
    tender_number: pickStr(extracted.tender_number),
    tender_value: pickStr(extracted.tender_value),
    tender_category: pickStr(extracted.tender_category),
    source_name: 'Telegram',
    status: 'pending',
    metadata: {
      source: 'telegram',
      telegram_chat_id: String(chatId),
      telegram_message_id: messageId ?? null,
      received_at: new Date().toISOString(),
      raw_text: sourceText.slice(0, 8000),
      additional_images: additionalImages,
    },
  };

  const { error: insErr } = await supabase.from('external_opportunities').insert(insertData);
  if (insErr) {
    console.error('[Telegram Webhook] insert error:', insErr.message);
    await tgSendMessage(botToken, chatId, '❌ Failed to save. Please try again.');
    return;
  }

  console.log(`[Telegram Webhook] AUDIT: intake id=${newId} type=${type} images=${imageUrls.length} by chat_id=${chatId}`);

  const summary = [
    '📥 <b>New opportunity for review</b>',
    `<b>Title:</b> ${cleanTitle}`,
    pickStr(extracted.organization) ? `<b>Org:</b> ${extracted.organization}` : null,
    `<b>Type:</b> ${type}`,
    pickStr(extracted.location) ? `<b>Location:</b> ${extracted.location}` : null,
    pickStr(extracted.qualification) ? `<b>Qualification:</b> ${extracted.qualification}` : null,
    pickStr(extracted.salary) ? `<b>Salary:</b> ${extracted.salary}` : null,
    pickStr(extracted.experience) ? `<b>Experience:</b> ${extracted.experience}` : null,
    positions ? `<b>Positions:</b> ${positions}` : null,
    normalizeDate(extracted.deadline_date) ? `<b>Deadline:</b> ${normalizeDate(extracted.deadline_date)}` : null,
    applyUrl ? `<b>Apply:</b> ${applyUrl}` : null,
    imageUrls.length ? `🖼 ${imageUrls.length} image${imageUrls.length > 1 ? 's' : ''} attached` : null,
    '',
    `<b>ID:</b> <code>${shortId(newId)}</code>`,
    'Reply <b>APPROVE</b> or <b>REJECT</b> (optionally with the ID).',
  ]
    .filter(Boolean)
    .join('\n');

  await tgSendMessage(botToken, chatId, summary);
}

// ---------- Main ----------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const ok = () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const secretToken = Deno.env.get('TELEGRAM_SECRET_TOKEN');
  const adminChatIds = (Deno.env.get('TELEGRAM_ADMIN_CHAT_IDS') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!botToken || !secretToken) {
    console.error('[Telegram Webhook] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_SECRET_TOKEN');
    return new Response(JSON.stringify({ error: 'Webhook not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 1) Secret-token verification (constant-time)
  const provided = req.headers.get('x-telegram-bot-api-secret-token') || '';
  const a = new TextEncoder().encode(provided);
  const b = new TextEncoder().encode(secretToken);
  let match = a.length === b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) match = false;
  }
  if (!match) {
    console.warn('[Telegram Webhook] AUDIT: rejected — invalid secret token');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let update: any;
  try {
    update = await req.json();
  } catch {
    return ok();
  }

  const message = update?.message ?? update?.edited_message;
  const chatId = message?.chat?.id;
  const messageId = message?.message_id;

  if (!message || chatId === undefined) {
    return ok();
  }

  // 2) chat_id whitelist
  if (!adminChatIds.includes(String(chatId))) {
    console.warn(`[Telegram Webhook] AUDIT: rejected unauthorized chat_id=${chatId}`);
    await tgSendMessage(botToken, chatId, '⛔ You are not authorized to use this bot.');
    return ok();
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const text: string = (message.text || message.caption || '').trim();
  const isPhoto = Array.isArray(message.photo) && message.photo.length > 0;
  const mediaGroupId: string | undefined = message.media_group_id;

  try {
    // 3) APPROVE / REJECT commands
    const cmdMatch = text.match(/^(approve|reject)\b\s*(.*)$/i);
    if (cmdMatch) {
      const action = cmdMatch[1].toLowerCase();
      const arg = (cmdMatch[2] || '').trim();
      const newStatus = action === 'approve' ? 'approved' : 'rejected';

      let target: any = null;
      if (arg) {
        const { data: rows } = await supabase
          .from('external_opportunities')
          .select('id, title, status')
          .eq('metadata->>telegram_chat_id', String(chatId))
          .ilike('id', `${arg}%`)
          .limit(1);
        target = rows?.[0] ?? null;
      } else {
        const { data: rows } = await supabase
          .from('external_opportunities')
          .select('id, title, status')
          .eq('metadata->>telegram_chat_id', String(chatId))
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1);
        target = rows?.[0] ?? null;
      }

      if (!target) {
        console.log(`[Telegram Webhook] AUDIT: ${action} — no matching item for chat_id=${chatId}`);
        await tgSendMessage(
          botToken,
          chatId,
          arg
            ? `⚠️ No opportunity found for id <code>${arg}</code> submitted from this chat.`
            : '⚠️ No pending opportunity from this chat to act on.',
        );
        return ok();
      }

      const { error: updErr } = await supabase
        .from('external_opportunities')
        .update({ status: newStatus, reviewed_at: new Date().toISOString() })
        .eq('id', target.id);

      if (updErr) {
        console.error('[Telegram Webhook] update error:', updErr.message);
        await tgSendMessage(botToken, chatId, '❌ Failed to update. Please try again.');
        return ok();
      }

      console.log(`[Telegram Webhook] AUDIT: ${newStatus} id=${target.id} by chat_id=${chatId}`);
      await tgSendMessage(
        botToken,
        chatId,
        action === 'approve' ? `✅ Approved: <b>${target.title}</b>` : `❌ Rejected: <b>${target.title}</b>`,
      );
      return ok();
    }

    // 4) MULTI-IMAGE (Telegram media group / album) — buffer & process as one
    if (isPhoto && mediaGroupId) {
      const largest = message.photo[message.photo.length - 1];

      // Register the group (idempotent) and buffer this photo.
      await supabase.from('telegram_media_groups').upsert(
        { media_group_id: mediaGroupId, chat_id: String(chatId) },
        { onConflict: 'media_group_id', ignoreDuplicates: true },
      );
      await supabase.from('telegram_media_buffer').insert({
        media_group_id: mediaGroupId,
        chat_id: String(chatId),
        file_id: largest.file_id,
        caption: message.caption || null,
        message_id: messageId ?? null,
      });

      // Debounce so every photo of the album lands before we process.
      await new Promise((r) => setTimeout(r, MEDIA_GROUP_DEBOUNCE_MS));

      // Leader election: only one invocation claims the group.
      const { data: claim } = await supabase
        .from('telegram_media_groups')
        .update({ processing_started: new Date().toISOString() })
        .eq('media_group_id', mediaGroupId)
        .is('processing_started', null)
        .select('media_group_id');

      if (!claim || claim.length === 0) {
        return ok(); // another invocation is the leader
      }

      const { data: bufferRows } = await supabase
        .from('telegram_media_buffer')
        .select('file_id, caption, message_id')
        .eq('media_group_id', mediaGroupId)
        .order('created_at', { ascending: true });

      const rows = bufferRows ?? [];
      if (rows.length === 0) return ok();

      await tgSendMessage(botToken, chatId, `🔎 Reading ${rows.length} image(s)…`);

      const imageUrls: string[] = [];
      const ocrParts: string[] = [];
      for (const row of rows) {
        if (row.caption) ocrParts.push(String(row.caption));
        const file = await tgGetFileBytes(botToken, row.file_id);
        if (!file) continue;
        const url = await uploadOpportunityImage(supabase, file.bytes, file.ext, file.mime);
        if (url) imageUrls.push(url);
        try {
          const ocr = await ocrImageBytes(file.bytes, file.mime);
          if (ocr) ocrParts.push(ocr);
        } catch (e) {
          console.error('[Telegram Webhook] group OCR failed:', (e as Error).message);
        }
      }

      const sourceText = ocrParts.filter(Boolean).join('\n\n').trim();
      if (!sourceText) {
        await tgSendMessage(botToken, chatId, '⚠️ Could not read the images. Please resend or paste the text.');
        // cleanup
        await supabase.from('telegram_media_buffer').delete().eq('media_group_id', mediaGroupId);
        return ok();
      }

      await runIntake(supabase, botToken, chatId, rows[0]?.message_id ?? messageId, sourceText, imageUrls);

      // Cleanup buffer rows (keep the group row as a processed marker briefly)
      await supabase.from('telegram_media_buffer').delete().eq('media_group_id', mediaGroupId);
      return ok();
    }

    // 5) SINGLE photo — download, upload, OCR (long-image aware)
    if (isPhoto) {
      await tgSendMessage(botToken, chatId, '🔎 Reading the image…');
      const largest = message.photo[message.photo.length - 1];
      const file = await tgGetFileBytes(botToken, largest.file_id);
      if (!file) {
        await tgSendMessage(botToken, chatId, '⚠️ Could not download the image. Please resend or paste the text.');
        return ok();
      }

      const imageUrls: string[] = [];
      const url = await uploadOpportunityImage(supabase, file.bytes, file.ext, file.mime);
      if (url) imageUrls.push(url);

      let ocrText = '';
      try {
        ocrText = await ocrImageBytes(file.bytes, file.mime);
      } catch (e) {
        console.error('[Telegram Webhook] OCR failed:', (e as Error).message);
        await tgSendMessage(botToken, chatId, '⚠️ AI is busy reading images. Please try again shortly or paste the ad as text.');
        return ok();
      }

      const sourceText = [text, ocrText].filter(Boolean).join('\n\n').trim();
      if (!sourceText) {
        await tgSendMessage(botToken, chatId, '⚠️ Could not read the image. Please resend or paste the text.');
        return ok();
      }

      await runIntake(supabase, botToken, chatId, messageId, sourceText, imageUrls);
      return ok();
    }

    // 6) TEXT-only intake
    if (!text) {
      await tgSendMessage(
        botToken,
        chatId,
        '👋 Send a job/scholarship/tender ad as text or a photo (multiple pages OK). I will extract it for your review.\n\nReply <b>APPROVE</b> or <b>REJECT</b> to act on the last item.',
      );
      return ok();
    }

    await runIntake(supabase, botToken, chatId, messageId, text, []);
    return ok();
  } catch (e) {
    console.error('[Telegram Webhook] Unhandled error:', (e as Error).message);
    try {
      await tgSendMessage(botToken, chatId, '❌ Something went wrong. Please try again.');
    } catch (_) { /* ignore */ }
    return ok();
  }
});
