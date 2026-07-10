# D2b — Make Board/Topic Practice Content Visible to Crawlers

## Problem (verified live)

Board/topic practice pages (e.g. `/boards/.../class-11/chemistry/stoichiometry`, which has **100 approved MCQs**) render **zero MCQ content and zero Quiz/FAQPage schema** to logged-out visitors and crawlers. Traced root cause:

- `content_items` RLS has a SELECT policy for the `authenticated` role only — **no `anon` policy**. A direct anonymous REST read of approved MCQs returns `[]` (HTTP 200).
- `BoardTopicPage` queries `content_items` directly, so for anon/Googlebot `mcqs.length === 0` → the page shows no questions, and neither `quizSchema` nor `faqSchema` is emitted.
- These pages are **not prerendered** (DB-driven), so nothing fills the gap in static HTML.

Net effect: the FAQPage schema is code-correct but **absent** for crawlers, and the "indexable" leaf pages look empty to Google. No cloaking exists today — logged-out humans see the same empty page — but that is the wrong side of the mismatch to fix.

## Scope (strict)

- **In scope:** Only BOARD/TOPIC practice pages (`BoardTopicPage`). These are meant to be free/public — question + correct answer + explanation are already rendered on-page via `PracticeMCQCard`.
- **Out of scope (do NOT touch):** Mock Tests and Job Tests scoring/submission/answer-reveal flow. Those use separate tables/RPCs (`job_test_questions`, `score_job_practice_answers`, `get_job_practice_questions`) and their cheating-prevention stays exactly as-is.
- **Also protected:** Custom syllabus / practice tests use `get_practice_questions`, a SECURITY DEFINER RPC that **deliberately omits `correct_option`** to prevent answer leakage. We must NOT undermine that — so we will **not** add a blanket `anon` SELECT on `content_items` (that would expose `correct_option` to anyone via REST and enable cheating in custom tests). Instead we use a narrow, purpose-built RPC.
- **Deferred (separate audit, per user):** rate-limiting and content-scraping protection — not included here.

## Cloaking safety

Google's cloaking policy requires crawlers and humans to receive identical content. Every change below serves the **same** MCQ content (question + answer + explanation) to anon crawlers AND anon humans. No conditional bot-only rendering.

## Technical plan

### 1. New SECURITY DEFINER RPC (DB migration)
Add `get_board_topic_mcqs(p_topic_id uuid, p_canonical_slug text, p_limit int default 50)`:
- `LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public`.
- Returns approved MCQ fields the practice page already displays: `id, title, options, correct_option, explanation, difficulty`.
- Filter: `category = 'mcq' AND status = 'approved'` AND (`topic_id = p_topic_id` OR `canonical_topic_name = p_canonical_slug`).
- `GRANT EXECUTE ... TO anon, authenticated;`
- This mirrors the existing `get_public_reviews` / `get_preview_questions` pattern and exposes answers **only** for board/topic practice content — `content_items` RLS is left unchanged, so custom-test and job-test integrity are untouched.

### 2. `BoardTopicPage.tsx`
- Replace the direct `supabase.from('content_items')...` query with `supabase.rpc('get_board_topic_mcqs', {...})`.
- Keep the existing admin path (admins still see unapproved via the current authenticated query) — branch: admins use the current direct query, everyone else uses the RPC.
- No UI changes; `quizSchema` and `faqSchema` now populate because `mcqs` is non-empty for anon.

### 3. Prerender indexable topic pages (bina-JS crawler + Rich Results reliability)
- 729 indexable topic paths exist (`src/generated/indexableTopics.json`).
- Add these paths to the prerender route list (`scripts/prerender-routes.mjs`) and ensure `prerender.tsx` can hydrate topic data at build time by calling the new RPC with the anon key (build-time fetch keyed by the manifest, so only real/indexable pages are prerendered).
- Result: static HTML ships with MCQ content + Quiz + FAQPage JSON-LD, so non-JS crawlers and the Rich Results Test both see valid schema.
- Tradeoff: adds ~729 build-time fetches; will batch and cache to keep build time reasonable. If build time becomes a problem, fall back to the RPC-only fix (JS-executing Googlebot still gets the schema) and prerender in a later pass.

## Verification (after publish)
1. Anonymous REST call to the new RPC returns approved MCQs (not `[]`).
2. Googlebot-UA fetch of a rich topic page (`chemistry/stoichiometry`) shows MCQ content + `Quiz` + `FAQPage` JSON-LD in both raw HTML (prerendered) and JS-rendered DOM.
3. Confirm human logged-out view is identical (no cloaking).
4. Spot-check a thin/`noindex` topic still has no schema and stays excluded.

Once verified, proceed to **D3 (internal linking)** — I'll send that plan next.
