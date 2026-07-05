# Phase 3.1 — Telegram Intake: Full Field Extraction Parity

## Problem

The `telegram-webhook` edge function extracts only ~11 fields, so the Opportunity Review modal shows empty `organization`, `qualification`, `salary`, `experience`, `positions`, `department`, `image_url`, etc. The `external_opportunities` table actually has columns for all of these — the webhook just isn't populating them. The "Enhance with AI Magic" button (`enhance-content`) already extracts the full set; we'll bring the Telegram path to parity.

## Confirmed findings

- `external_opportunities` has these extra columns not currently mapped by the webhook: `image_url`, `qualification`, `salary`, `experience`, `positions` (int), `department`, `amount`, `field_of_study`, `education_level`, `tender_number`, `tender_value`, `tender_category`, `document_url`.
- `enhance-content` uses per-category prompts (job / scholarship / tender) that already define all these fields — we mirror those.
- `apply_url` currently only accepts `https://`; emails (e.g. `healthrecruitmentjobs93@gmail.com`) are dropped. Shared helper `mailtoForApplyUrl` in `supabase/functions/_shared/sanitize.ts` already converts a bare email to `mailto:`.
- Photos: `tgGetFileBase64` downloads bytes for OCR but discards them. Telegram's public file URL embeds the bot token and expires — unsafe to persist. We'll upload the poster to Supabase Storage instead.

## Design decisions

- **Description**: prompt returns a detailed GitHub-flavored Markdown breakdown (Overview / Eligibility / How to Apply / Important Dates, plus a posts table when multiple positions appear) — same style as AI Content Studio. Raw text is still kept in `metadata.raw_text`.
- **Image storage**: create a **public** Storage bucket `opportunity-images`; upload the largest Telegram photo there and save the public URL to `image_url`. (Chosen over persisting the token-bearing Telegram URL for security + permanence.)
- **Apply URL**: accept `https?://` as-is; convert a bare email to `mailto:`; otherwise fall back to the existing internal placeholder. Dedupe still keyed on a real apply URL.

## Steps

### 1. Create public Storage bucket `opportunity-images`

Via the storage tool (public, image mime types). If the workspace blocks public buckets, surface that and keep it private with a note.

### 2. Rewrite the extraction prompt in `telegram-webhook/index.ts`

Replace `EXTRACTION_SYSTEM` with a schema-complete instruction returning JSON with EXACTLY these keys (null when absent):  
`title, type ("job"|"scholarship"|"tender"), organization, description (Markdown), deadline_date (YYYY-MM-DD), apply_url, location, sector, region, qualification, salary, experience, positions (int|null), department, eligibility, amount, field_of_study, education_level, scholarship_scope, tender_number, tender_value, tender_category`.  
Rules mirror `enhance-content`: clean OCR artifacts, convert Urdu/Pakistani dates, never invent data, description is a single Markdown string with headings/bullets/tables, title is never an email/URL.

### 3. Refactor photo handling for upload + OCR

- Change `tgGetFileBase64` (or add a sibling) to return `{ bytes, base64, mime, ext }` so the same download feeds both OCR and the storage upload.
- After OCR, upload `bytes` to `opportunity-images/telegram/<uuid>.<ext>` with the service-role client, get the public URL, and set `image_url`.
- On upload failure, log and continue (item still saved without image).

### 4. Map every field into the insert

Expand the `external_opportunities` insert to include `image_url`, and all type-specific columns (`qualification, salary, experience, positions, department, amount, field_of_study, education_level, tender_number, tender_value, tender_category`) with the same validation/whitelisting already used for `sector`/`region`/`scholarship_scope`. `positions` parsed to int or null.

### 5. Apply-URL normalization

Import `mailtoForApplyUrl` from `_shared/sanitize.ts`. Compute `applyUrl` = valid http(s) → as-is; else if extracted value/text contains an email → `mailto:`; else null → internal placeholder. Keep dedupe on real (non-placeholder) URLs.

### 6. Enrich the Telegram confirmation summary

Add Qualification / Salary / Deadline / Apply / "🖼 image attached" lines when present so you can sanity-check extraction before APPROVE/REJECT.

### 7. Deploy & verify

Deploy `telegram-webhook`, then send a text ad and a photo ad; confirm in logs and the Opportunity Review modal that organization, qualification, salary, experience, positions, department, image_url and apply_url are populated.

## Out of scope

- No schema/migration changes (all columns already exist).
- No changes to the review UI or `enhance-content`.
- WhatsApp / editing fields via Telegram.

## Technical notes

- Bucket upload uses the existing service-role `supabase` client already created in the handler.
- `.ext`/mime derived from Telegram `file_path` (jpg/png/webp), default `image/jpeg`.
- `description` capped (raise current 2000-char limit to ~6000 to fit the richer Markdown).

&nbsp;

# **Approved — proceed with Phase 3.1 exactly as planned.**

&nbsp;

One confirmation needed before implementing: for the 

opportunity-images Storage bucket — please create it as PUBLIC 

(so image_url can be served directly to users in the Opportunity 

Review modal and public pages). If Lovable's workspace blocks 

public buckets, let me know and we'll keep it private with 

signed URLs instead.

&nbsp;

After implementing, I'll test by sending:

1. A text job ad with email apply link

2. A photo of a job ad

&nbsp;

Please confirm both show fully populated fields in the 

Opportunity Review modal (organization, qualification, salary, 

experience, positions, image_url all filled).

&nbsp;

ADDITIONAL REQUIREMENT — Multi-image and long image support:

&nbsp;

Currently when an admin sends:

1. A long/tall job ad image (single image with lots of text) — 

   OCR misses content at the bottom or reads it incorrectly

2. Multiple images for ONE job ad (e.g., page 1 + page 2 of 

   same ad) — only the first image is processed, rest are ignored

&nbsp;

Please fix both cases:

&nbsp;

1. LONG IMAGE: When OCR'ing a tall/long image, ensure the full 

   image is processed — not just the top portion. If Gemini 

   Vision has a limitation with very tall images, consider 

   splitting the image into overlapping vertical chunks before 

   sending to OCR, then merging the extracted text.

&nbsp;

2. MULTI-IMAGE (album/media group): Telegram sends multiple 

   photos as a "media group" (same media_group_id). Currently 

   each photo triggers a separate webhook call. Please handle 

   this by:

   - Detecting media_group_id on incoming messages

   - Buffering/collecting images with the same media_group_id 

     for a short window (e.g., 3-5 seconds)

   - Processing ALL collected images together as one job ad 

     (OCR all pages, concatenate text, then single extraction)

   - Sending ONE confirmation reply (not one per image)

&nbsp;

3. For multi-image, store all uploaded images — save the first 

   as image_url (primary), and store the rest as additional_images 

   in metadata (array of URLs) so they're accessible for review.

&nbsp;

After implementing, please test with:

- A long/tall single image ad

- A 2-page ad sent as 2 separate photos in sequence

&nbsp;

Confirm both work correctly before reporting back.