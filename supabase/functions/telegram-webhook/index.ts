import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAIWithAutoSwitch, callVisionWithAutoSwitch } from '../_shared/gemini.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token',
};

const TELEGRAM_API = 'https://api.telegram.org';

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

async function tgGetFileBase64(botToken: string, fileId: string): Promise<{ base64: string; mime: string } | null> {
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
    const buf = new Uint8Array(await fileRes.arrayBuffer());

    // Base64 encode in chunks (avoid call-stack overflow on large images)
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < buf.length; i += chunk) {
      binary += String.fromCharCode(...buf.subarray(i, i + chunk));
    }
    const base64 = btoa(binary);
    const mime = filePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    return { base64, mime };
  } catch (e) {
    console.error('[Telegram] getFile failed:', (e as Error).message);
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

const EXTRACTION_SYSTEM = `You are a precise data extractor for a Pakistani jobs & scholarships platform.
From the given job/scholarship advertisement text, extract structured fields and return ONLY a valid JSON object (no markdown, no commentary) with EXACTLY these keys:
{
  "title": string,              // concise role/scholarship name — NEVER an email, URL or phone number
  "organization": string|null,  // hiring company / institution
  "deadline_date": string|null, // ISO date YYYY-MM-DD if a deadline is present, else null
  "apply_url": string|null,     // application link if present, else null
  "type": "job"|"scholarship",  // classify; default "job" if ambiguous
  "description": string|null,   // 1-3 sentence summary
  "location": string|null,      // city / province / country
  "eligibility": string|null,   // eligibility / qualification requirements
  "sector": "government"|"private"|null,
  "region": "sindh"|"punjab"|"kpk"|"balochistan"|"federal"|"international"|"other"|null,
  "scholarship_scope": "national"|"international"|null
}
Rules: Use null for anything not clearly stated. Do not invent URLs or dates. Return raw JSON only.`;

function safeParseJson(raw: string): any | null {
  if (!raw) return null;
  let t = raw.trim();
  // Strip code fences
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

function shortId(id: string): string {
  return id.slice(0, 8);
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

  try {
    // 3) APPROVE / REJECT commands
    const cmdMatch = text.match(/^(approve|reject)\b\s*(.*)$/i);
    if (cmdMatch) {
      const action = cmdMatch[1].toLowerCase();
      const arg = (cmdMatch[2] || '').trim();
      const newStatus = action === 'approve' ? 'approved' : 'rejected';

      // Find target: explicit id (full uuid or 8-char short) OR latest pending from THIS chat
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

    // 4) Intake — must have text or a photo
    let sourceText = text;

    if (isPhoto) {
      await tgSendMessage(botToken, chatId, '🔎 Reading the image…');
      const largest = message.photo[message.photo.length - 1];
      const file = await tgGetFileBase64(botToken, largest.file_id);
      if (!file) {
        await tgSendMessage(botToken, chatId, '⚠️ Could not download the image. Please resend or paste the text.');
        return ok();
      }
      try {
        const ocr = await callVisionWithAutoSwitch(
          'Extract ALL readable text from this job/scholarship advertisement image. Return only the raw text, preserving line breaks. Do not summarize.',
          file.base64,
          file.mime,
          { temperature: 0.1 },
        );
        sourceText = [text, ocr.text].filter(Boolean).join('\n\n').trim();
      } catch (e) {
        console.error('[Telegram Webhook] OCR failed:', (e as Error).message);
        await tgSendMessage(botToken, chatId, '⚠️ AI is busy reading images. Please try again shortly or paste the ad as text.');
        return ok();
      }
    }

    if (!sourceText) {
      await tgSendMessage(
        botToken,
        chatId,
        '👋 Send a job/scholarship ad as text or a photo. I will extract it for your review.\n\nReply <b>APPROVE</b> or <b>REJECT</b> to act on the last item.',
      );
      return ok();
    }

    // 5) Structured extraction
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
      return ok();
    }

    if (!extracted || !extracted.title) {
      await tgSendMessage(botToken, chatId, "⚠️ I couldn't extract a clear opportunity from that. Please resend with more detail.");
      return ok();
    }

    // Sanitize title
    let cleanTitle = String(extracted.title).trim();
    if (isContactInfoTitle(cleanTitle)) {
      cleanTitle =
        extracted.organization && !isContactInfoTitle(String(extracted.organization))
          ? String(extracted.organization).trim()
          : extracted.type === 'scholarship'
          ? 'Scholarship Opportunity'
          : 'Job Opportunity';
    }

    const type = extracted.type === 'scholarship' ? 'scholarship' : 'job';
    const applyUrl =
      extracted.apply_url && /^https?:\/\//i.test(String(extracted.apply_url))
        ? String(extracted.apply_url).trim()
        : null;

    // Dedupe against a real apply_url only
    if (applyUrl) {
      const { data: dup } = await supabase
        .from('external_opportunities')
        .select('id')
        .eq('apply_url', applyUrl)
        .maybeSingle();
      if (dup) {
        await tgSendMessage(botToken, chatId, 'ℹ️ This opportunity (same apply link) already exists.');
        return ok();
      }
    }

    const newId = crypto.randomUUID();
    const finalApplyUrl = applyUrl || `https://mcqsai.com/telegram-intake/${newId}`;

    const { error: insErr } = await supabase.from('external_opportunities').insert({
      id: newId,
      title: cleanTitle.slice(0, 500),
      description: extracted.description ? String(extracted.description).slice(0, 2000) : null,
      apply_url: finalApplyUrl,
      type,
      organization: extracted.organization ?? null,
      location: extracted.location ?? null,
      deadline_date: normalizeDate(extracted.deadline_date),
      sector: ['government', 'private'].includes(extracted.sector) ? extracted.sector : null,
      region: ['sindh', 'punjab', 'kpk', 'balochistan', 'federal', 'international', 'other'].includes(extracted.region)
        ? extracted.region
        : null,
      scholarship_scope: ['national', 'international'].includes(extracted.scholarship_scope)
        ? extracted.scholarship_scope
        : null,
      eligibility: extracted.eligibility ?? null,
      source_name: 'Telegram',
      status: 'pending',
      metadata: {
        source: 'telegram',
        telegram_chat_id: String(chatId),
        telegram_message_id: messageId ?? null,
        received_at: new Date().toISOString(),
        raw_text: sourceText.slice(0, 4000),
      },
    });

    if (insErr) {
      console.error('[Telegram Webhook] insert error:', insErr.message);
      await tgSendMessage(botToken, chatId, '❌ Failed to save. Please try again.');
      return ok();
    }

    console.log(`[Telegram Webhook] AUDIT: intake id=${newId} type=${type} by chat_id=${chatId}`);

    const summary = [
      '📥 <b>New opportunity for review</b>',
      `<b>Title:</b> ${cleanTitle}`,
      extracted.organization ? `<b>Org:</b> ${extracted.organization}` : null,
      `<b>Type:</b> ${type}`,
      extracted.location ? `<b>Location:</b> ${extracted.location}` : null,
      normalizeDate(extracted.deadline_date) ? `<b>Deadline:</b> ${normalizeDate(extracted.deadline_date)}` : null,
      applyUrl ? `<b>Apply:</b> ${applyUrl}` : null,
      '',
      `<b>ID:</b> <code>${shortId(newId)}</code>`,
      'Reply <b>APPROVE</b> or <b>REJECT</b> (optionally with the ID).',
    ]
      .filter(Boolean)
      .join('\n');

    await tgSendMessage(botToken, chatId, summary);
    return ok();
  } catch (e) {
    console.error('[Telegram Webhook] Unhandled error:', (e as Error).message);
    try {
      await tgSendMessage(botToken, chatId, '❌ Something went wrong. Please try again.');
    } catch (_) { /* ignore */ }
    return ok();
  }
});
