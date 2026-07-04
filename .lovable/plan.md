# Phase 3 — Telegram Remote Intake for Jobs/Scholarships

## Confirmed findings (from investigation)

- `external_opportunities` already has every field needed (`title`, `organization`, `deadline_date`, `apply_url`, `type`, `description`, `location`, `eligibility`, `sector`, `region`, `scholarship_scope`, `status`, `source_name`, `metadata`). `apply_url` and `source_name` are `NOT NULL` → we default them.
- **Approve/Reject logic** exists as a frontend service; the webhook will replicate the same DB update server-side (service-role client). Items appear in the same `OpportunityReviewHub` automatically.
- **No Telegram connector** is linked → use the **direct Telegram Bot API** with a bot-token secret.
- **Gemini is ready**: reuse `callVisionWithAutoSwitch` (photo OCR) and `callAIWithAutoSwitch` (structured extraction) from `_shared/gemini.ts`.
- **No new tables** — per your choice, source/audit info is stored in `external_opportunities.metadata`; failed-auth and all intake attempts go to edge-function console logs.

## Design decisions (from your answers)

- Audit: store source in `metadata` + console logs (no new table).
- APPROVE sets `status='approved'` → goes live on public Jobs/Scholarships pages.
- Setup guide will include how to find your numeric `chat_id`.

---

## Step 1 — Secrets (requested before deploy)

Add three secrets:

- `TELEGRAM_BOT_TOKEN` — bot token from @BotFather.
- `TELEGRAM_SECRET_TOKEN` — random string (I'll generate) used as Telegram's `X-Telegram-Bot-Api-Secret-Token` header for request verification.
- `TELEGRAM_ADMIN_CHAT_IDS` — comma-separated whitelist of allowed numeric chat_ids (you'll paste yours).

## Step 2 — New edge function `supabase/functions/telegram-webhook/index.ts`

Register `[functions.telegram-webhook] verify_jwt = false` in `supabase/config.toml` (Telegram sends no Supabase JWT).

Request flow:

1. **Security gate**
  - Compare `X-Telegram-Bot-Api-Secret-Token` header to `TELEGRAM_SECRET_TOKEN` (constant-time compare). Reject 401 on mismatch.
  - Extract `message.chat.id`; reject if not in `TELEGRAM_ADMIN_CHAT_IDS`. Log every accepted/rejected attempt (`chat_id`, type, outcome) to console.
  - Always return HTTP 200 to Telegram after handling (so it doesn't retry), even on logical rejects — the reject is communicated by replying to the user.
2. **Command detection** — if message text starts with `APPROVE` / `REJECT` (case-insensitive):
  - Parse optional id: `APPROVE <uuid>` / `APPROVE <short-code>`. With no id → act on the **most recent** `pending` **item from this chat** (found via `metadata->>telegram_chat_id` + `status='pending'`, newest first).
  - Update `status` to `approved`/`rejected`, set `reviewed_at`. Reply `✅ Approved: <title>` / `❌ Rejected: <title>` (or a "nothing pending" message).
3. **Intake (text)** — non-command text:
  - Call `callAIWithAutoSwitch` with an extraction prompt → strict JSON `{title, organization, deadline_date, apply_url, type, description, location, eligibility, sector, region, scholarship_scope}`.
  - Reuse the `isContactInfoTitle` guard (copied from `external-agent-webhook`) so a contact/URL never becomes the title.
4. **Intake (photo)**:
  - Take the largest `message.photo` size, call Telegram `getFile` + download file via bot token, base64-encode.
  - `callVisionWithAutoSwitch` to OCR → extracted text → same extraction step as text.
5. **Insert** into `external_opportunities`:
  - `status='pending'`, `source_name='Telegram'`, `apply_url` = extracted URL or a placeholder (`https://mcqsai.com/telegram-intake/<uuid>`), dedupe by `apply_url` when a real URL exists.
  - `metadata`: `{ source: 'telegram', telegram_chat_id, telegram_message_id, received_at, raw_text }`.
  - Reply to admin: extracted summary (title, org, type, deadline, location) + short id + `Reply APPROVE or REJECT`.
6. **Error handling** — Gemini quota (429) / parse failure → reply a friendly "couldn't read that, try again / paste as text" message; log details. Never throw an unhandled 500 back to Telegram.

## Step 3 — Deploy & verify

- Deploy `telegram-webhook`; confirm it responds to a signed test POST (secret check, whitelist check, sample text extraction) via curl and inspect logs.

## Step 4 — Setup guide (delivered in chat after implementation)

1. Create bot via **@BotFather** → get `TELEGRAM_BOT_TOKEN`.
2. Find your `chat_id`: message **@userinfobot** (or hit `getUpdates`), paste into `TELEGRAM_ADMIN_CHAT_IDS`.
3. Register webhook (one curl command I'll provide):
  `https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://pzhvipkcssxrsxxljbbz.supabase.co/functions/v1/telegram-webhook&secret_token=<TELEGRAM_SECRET_TOKEN>&allowed_updates=["message"]`
4. Verify with `getWebhookInfo`; send a test text/photo.

## Technical notes

- **No new tables**; reuses `external_opportunities` + existing `OpportunityReviewHub` queue.
- Human-in-the-loop preserved: nothing is `approved` without an explicit APPROVE reply.
- Files touched: new `supabase/functions/telegram-webhook/index.ts`, `supabase/config.toml` (one entry). No frontend changes required — Telegram items surface in the existing admin queue.

## Out of scope

- WhatsApp intake (Telegram only for this phase).
- Editing extracted fields via Telegram (edits happen in the admin panel).

&nbsp;

# **Approved — proceed with Phase 3** implementation exactly as planned.

&nbsp;

Before deploying, please:

1. Generate a secure random TELEGRAM_SECRET_TOKEN and show it 

   to me (I'll add it to Supabase secrets along with the bot 

   token and chat_id)

2. Implement the telegram-webhook edge function

3. Add the config.toml entry

4. Provide the complete setup guide (BotFather steps + webhook 

   registration curl command) after implementation

&nbsp;

One clarification: for the "most recent pending item" APPROVE 

(when no UUID given), please also make sure it only looks at 

items submitted via THIS Telegram chat (metadata->telegram_chat_id 

matching), not any pending item from other sources — so I don't 

accidentally approve a manually-entered item when I type APPROVE 

in Telegram.