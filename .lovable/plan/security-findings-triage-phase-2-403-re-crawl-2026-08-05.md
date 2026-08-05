# Security findings triage + Phase 2 (403 re-crawl)

## Part 1 — The 4 new scan findings, with severity

### S-1. AI document search can read other users' private documents — HIGH (real data exposure)

`search-documents` and `rag-search` authenticate the caller, then call the `SECURITY DEFINER`  
RPC `match_document_sections` through a **service-role** client. The RPC filters only by an  
optional `filter_document_id` and never checks ownership, so RLS on `document_sections` is  
bypassed: with no document id it searches every user's uploads, and with a supplied id any  
user can read someone else's document.

Mitigating context (verified in code): `rag-search` is currently killed by the  
`RAG_SEARCH_ENABLED !== "true"` guard added for the /ask-document "Coming Soon" work, and  
`/ask-document` no longer calls it. `search-documents` has no such guard. Exposure is limited  
to signed-in users and to documents actually uploaded so far — but the hole is real.

Fix size: **small** — add an owner filter inside `match_document_sections`  
(`join documents d ... where d.user_id = _user_id or is_admin()`) and pass the verified  
caller id from both edge functions. One migration + two small function edits.

### S-2. `documents` INSERT policy does not check `user_id = auth.uid()` — MEDIUM

Any signed-in user can insert a document row attributed to another account (misattribution /  
poisoning another user's library), because `WITH CHECK` only tests `auth.uid() IS NOT NULL`.

Fix size: **tiny** — one-line policy replacement in a migration. Pairs naturally with S-1.

### S-3. IndexNow endpoints callable by anyone — MEDIUM

`indexnow-ping` and `indexnow-submit-recent` run with `verify_jwt = false` and no  
service-role/admin check. Anyone can spam them: outbound IndexNow submissions under our key  
(quota abuse / possible throttling of the domain) plus repeated multi-table DB scans. No data  
is leaked and no writes are possible.

Fix size: **small** — add the project's standard service-role-or-admin-JWT check, matching the  
other cron functions. Cron keeps working because it sends the service-role bearer.

### S-4. `opportunity-images` private bucket has no storage policies — LOW

Fails **closed**: no exposure. It just means normal read/write must go through service role.  
Cosmetic/robustness only.

**Recommendation:** S-1 + S-2 + S-3 are all quick and belong together in one short batch  
(one migration, three edge-function touches, no UI work). That is cheaper than a separate  
turn later. S-4 can wait indefinitely.

## Part 2 — Phase 2: force re-crawl of the frozen 403 tier (I-2)

1. **Bump** `lastmod` to today (2026-08-05) in `public/sitemap.xml` and in the affected child
  sitemaps — `exams.xml`, `blog.xml`, `programmatic.xml`, `jobs.xml` — plus the same in  
   `scripts/generate-sitemaps.mjs` so the next build does not revert it. Only `lastmod` values  
   change; no URL set changes.
2. **Publish**, then re-submit the sitemap index and the four child sitemaps through the
  Search Console API (`PUT .../sitemaps/{encoded}`) so Google re-downloads them.
3. **Re-inspect** the known-403 sample via URL Inspection to record the pre-fix state as a
  baseline: `/exams/mdcat`, `/exams/nts`, `/exams/css`, `/exams/ppsc`, `/exams/fpsc`,  
   `/p/mdcat-karachi`, `/blog/mdcat-preparation-strategy-2026`, and one `/opportunity/...`.
4. **Manual Request Indexing** — this is the one step I cannot do for you. The Search Console
  API has no "request indexing" method; `index:inspect` only reads Google's stored state.  
   You must click **Request Indexing** in Search Console for the ~10 tier-1 URLs. I will give  
   you the exact copy-paste list after step 2.
5. **Verify in 7–10 days**: re-run URL Inspection on the same sample and confirm the state
  flips from "Blocked due to access forbidden (403)" to a successful fetch. Nothing gets  
   called fixed before Google reports a green fetch.

## Technical notes

- Files touched by Phase 2: `public/sitemap.xml`, `public/sitemaps/{exams,blog,programmatic,jobs}.xml`,  
`scripts/generate-sitemaps.mjs`. No app code, no runtime behaviour change.
- Sitemap child files are build-generated, so the generator edit is what makes the bump stick.
- Security batch touches: one new migration (RPC owner filter + `documents` INSERT policy),  
`supabase/functions/search-documents/index.ts`, `supabase/functions/rag-search/index.ts`,  
`supabase/functions/indexnow-ping/index.ts`, `supabase/functions/indexnow-submit-recent/index.ts`.
- `RAG_SEARCH_ENABLED` kill switch stays in place; the fix does not re-enable /ask-document.

## Suggested order this turn

Security batch (S-1, S-2, S-3) first — it is short and S-1 is an active cross-user read — then  
Phase 2 steps 1–3 in the same turn, ending with your Request-Indexing URL list. S-4 deferred.

Tell me if you would rather skip straight to Phase 2 and leave all security items for later.

&nbsp;

Approved — is order mein karein:

&nbsp;

1. Security-batch (S-1, S-2, S-3) — pehle, kyunki S-1 ACTIVE-cross-user-data-exposure hai, turant-fix-honi-chahiye.

2. Phase-2 (steps 1-3): sitemap-lastmod-bump, resubmit, aur known-403-sample-re-inspect.

3. Phase-2 step-4 (Manual Request-Indexing) — mujhe EXACT copy-paste-URL-list de dein, main khud Search-Console mein jaake click karunga.

&nbsp;

S-4 skip kar dein, zaroorat-nahi.