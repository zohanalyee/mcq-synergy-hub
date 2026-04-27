# Plan: Loader, Quiz UI, and Subject AI Persistence Fixes

## Issue 1: Double Loader / Inconsistent Branded Loader

### Findings

- `src/App.tsx` line 200 already uses our `<BrandingLoader />` as the Suspense fallback — there is no separate "generic Loading..." component. The text the user sees is our branded loader's `message` prop, which is currently set to `"Loading..."`.
- The "Good" loader screenshot is `<PageLoader />` (used during route transitions) which renders `<BrandingLoader fullScreen size="lg" message="AI-Powered Exam Prep" />`.
- The "Bad" loader is the same `BrandingLoader` but rendered at `size="md"` without `fullScreen`, so it appears as a small centered block at the top of the page before route content mounts — visually it looks different and shows up briefly between the page-level `PageLoader` finishing and the lazy chunk arriving, causing the "two loaders back-to-back" impression.

### Fix

- In `src/App.tsx`, change the top-level `<Suspense fallback>` to render the same full-screen branded experience as `PageLoader`:
  - `<BrandingLoader fullScreen size="lg" message="AI-Powered Exam Prep" />`
- Replace the inline `<Suspense fallback={null}>` wrappers around individual routes (Boards, JobDetailPage, etc.) with the same full-screen branded loader so every lazy chunk shows the identical branded screen — eliminating the "second/different" loader perception.
- Keep `PageLoader` as-is; both will now show the exact same visual.

## Issue 2: Quiz UI/UX Upgrade

### Findings

- `src/pages/Quizzes.tsx` is the **setup page** (subject/topic selectors + sliders). After the user clicks "Start Quiz", it navigates to `/test-session/:id` which renders `src/pages/TestSession.tsx` — the **same** premium player used by Mock Tests and Custom Syllabus. So the actual quiz-taking and results UI is already the polished one.
- The visual issue is on the `/quizzes` setup page itself, which uses small/compact cards and `text-[11px]` descriptions, looking less premium than the Mock Tests landing page.

### Fix

- Refactor `src/pages/Quizzes.tsx` setup page to match the Mock Tests aesthetic:
  - Larger card with gradient header (matching Mock Tests / Job Tests cards)
  - Bigger typography (remove the 11px / 8px ultra-compact sizing)
  - Add an info strip showing live availability ("X questions available in this subject") via a quick `content_items` count query — same pattern Mock Tests uses
  - Add a subtle "Powered by Question Bank" badge with a question-count chip
  - Keep the existing Subject/Topic tab structure and start handlers
- No change to `TestSession.tsx` — quiz playback and results already use the premium player.

## Issue 3: Subject Page AI Generation Persistence

### Findings

- `supabase/functions/generate-test/index.ts` **already** inserts AI-generated questions into `content_items` (status `approved`, `category mcq`, `show_in_subjects: true`) on every AI run — see lines 1078, 1552, 1928. So persistence to the Question Bank is already happening backend-side whenever Subject Page calls `generate-test` with `forceNew=true, fetch_only=false`.
- **Real gap**: inserted rows save `subject` and `topic` as text, but do **not** populate `topic_id` (FK to `topics`) or `canonical_topic_name`. This means the questions are saved but not properly linked into the LMS hierarchy, so the inventory RPCs (`get_lms_content_inventory`, `get_topic_inventory`) miss them and they don't show up under the topic in Syllabus Builder.

### Fix

- In `src/pages/SubjectContent.tsx` `loadMCQs`, pass the LMS context to the edge function:
  - Add `subject_id`, `topic_id` (when a specific topic is selected, resolve from `dbTopics`), and `canonical_topic_name` to the body.
- In `supabase/functions/generate-test/index.ts`, accept those new fields in the request schema and include them in **every** `content_items` insert path (the three insert sites at ~1078, ~1552, ~1928). Also derive `canonical_topic_name` server-side (slugified topic) when not provided so older callers still benefit.
- This ensures every AI-generated MCQ from Subject Pages is:
  1. Saved as `approved` in `content_items` (already working)
  2. Linked to the correct `topic_id` and subject (new)
  3. Visible in Syllabus Builder, Mock Tests, and Question Bank (new outcome of the FK link)

### Verification after deploy

- Open a Subject → Practice → click "Generate New" → refresh the page: the questions persist (DB-fetch path will pick them up).
- Run `select count(*) from content_items where topic_id is not null and source = 'ai'` to confirm new rows get linked.

## Files to change

- `src/App.tsx` — unify Suspense fallback to full-screen branded loader
- `src/pages/Quizzes.tsx` — premium setup card styling + availability chip
- `src/pages/SubjectContent.tsx` — pass `subject_id` / `topic_id` / `canonical_topic_name` to `generate-test`
- `supabase/functions/generate-test/index.ts` — accept and persist those FKs in all insert paths

No DB migrations required — `content_items.topic_id` and `canonical_topic_name` columns already exist.   **Crucial Clarification on Issue 2 (Quiz UI):** **Just to be absolutely clear—I am not just talking about the Quiz Setup/Landing page. The actual *Quiz-Taking Experience* (when the questions are being answered by the user) MUST NOT be a simple vertical scrolling list of generic MCQs. It MUST strictly render inside the interactive, one-question-at-a-time, premium** `TestSession` **player (with the timer, distinct option boxes, and detailed review screen). Make sure your routing and component logic guarantees this exact player is used for Quizzes**