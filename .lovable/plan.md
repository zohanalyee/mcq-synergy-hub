# Dual-Path AI Blog Generation

Add a "Zero-Touch" AI generator at the top of the New/Edit Blog Post form with two tabs. On generation, all blog fields (title, slug, excerpt, content, meta title, meta description, category, tags) auto-populate so the admin can review and click Publish.

## 1. UI — BlogManager.tsx

At the top of the create/edit form, add a `Tabs` block: **AI Generate** (default when creating) and **Manual Edit**. The AI panel has two sub-tabs:

- **Path A — From Existing Content**
  - Source selector: `Jobs | Scholarships`
  - Searchable dropdown listing approved rows from `external_opportunities` (filtered by `type` and `status='approved'`) plus `content_items` (category `job`/`scholarship`, status `approved`) — merged & deduped by id.
  - Optional "Angle" input (e.g. "eligibility focus", "step-by-step apply guide").
  - **Generate** button → calls edge function with `mode: 'from_content'`, `source_id`, `source_table`.

- **Path B — From Admin Instructions**
  - Dropdown of preset prompts seeded client-side (e.g. "Guide to passing MDCAT 2026", "Top FPSC preparation tips", "9th class study routine", "How to apply for HEC scholarships", "PPSC interview strategy", etc.) — ~10 presets grouped by category.
  - Free-text "Custom instructions" textarea (optional, appended to preset).
  - **Generate** button → calls edge function with `mode: 'from_prompt'`, `preset_id`, `custom_instructions`.

On success, the edge function response populates `form` state (title, slug, excerpt, content, category, tags, meta_title, meta_description). Toast confirms and switches to **Manual Edit** tab so admin can review.

## 2. Edge function — `supabase/functions/generate-blog/index.ts` (rewrite)

Replace the current single-mode signature. New input schema (validated with zod or manual checks):

```ts
{ mode: 'from_content' | 'from_prompt',
  // from_content
  source_table?: 'external_opportunities' | 'content_items',
  source_id?: string,
  angle?: string,
  // from_prompt
  preset_topic?: string,    // the preset's full instruction text
  custom_instructions?: string,
  target_length?: number }
```

Logic:
- Admin auth check (existing).
- **from_content**: fetch row by id from the chosen table using service-role client. Build a context block (title, description, organization, deadline, eligibility, apply_url, tags…). Prompt Gemini to rewrite/expand into a Pakistan-context SEO blog post, returning **strict JSON**: `{ title, slug, excerpt, content_markdown, category, tags[], meta_title, meta_description }`.
- **from_prompt**: send the preset + custom instructions; same JSON output contract.
- Use existing `callAIWithAutoSwitch` with `response_mime_type: application/json` (or post-parse with JSON-repair fallback already used elsewhere).
- **Do not insert into `blog_posts` anymore** — return the structured fields to the client. Saving happens via the existing form Save flow (so admin can still edit before publish). This matches the user's "review and click Publish" requirement.
- Log to `ai_usage_logs` as today.

## 3. Preset prompts

Stored as a TS constant in `src/components/admin/blogPresets.ts` (~10–12 entries) to avoid a migration. Each: `{ id, label, category, instruction, default_keywords[] }`. User can extend later; a follow-up migration to a `blog_prompt_presets` table is easy if needed (not in this plan).

## 4. Files touched

- `supabase/functions/generate-blog/index.ts` — rewrite for dual-mode, return JSON instead of inserting.
- `src/components/admin/BlogManager.tsx` — add Tabs UI, AI panels, generation handlers, form auto-fill.
- `src/components/admin/blogPresets.ts` — new, preset prompts list.
- `src/components/admin/blog/AIGeneratePanel.tsx` — new, encapsulates both AI paths to keep BlogManager readable.

## 5. Out of scope

- New DB tables (presets stay in code).
- Auto-publishing (admin still clicks Save/Publish).
- Bulk generation across multiple jobs/scholarships at once.

Confirm and I'll implement.
