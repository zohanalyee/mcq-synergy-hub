
Plan to fix both issues after approval:

1. Fix `src/components/mock-tests/JobTestsTab.tsx`
- In the per-subject deficit `for...of` loop, add `forceNew: true` to the `generate-test` invoke body.
- Also set `question_count` in `sessionPayload` to the actual initial payload length (`generatedTest.questions.length`), not `options.questionCount`.
- Keep the expected total controlled by the actual saved session size so the submit button cannot deadlock waiting for missing questions that never arrived.

2. Prevent submit deadlock caused by session mismatch
- Verify the session insert uses the merged/available question count as the source of truth.
- This aligns with `TestSession.tsx`, which currently reads `question_count` to compute `remainingCount`, polling, and `canSubmit`.
- Result: if only 13 questions exist, the session will expect 13 and the UI will allow submit normally.

3. Fix sitemap domain issue at the source
- Update `supabase/functions/generate-sitemap/index.ts` so the sitemap index emits `https://mcqsai.com/...` URLs instead of Supabase function URLs.
- Best low-risk approach: expose same-domain sitemap endpoints like:
  - `https://mcqsai.com/sitemap.xml`
  - `https://mcqsai.com/sitemaps/static.xml`
  - `https://mcqsai.com/sitemaps/tools.xml`
  - `https://mcqsai.com/sitemaps/exams.xml`
  - `https://mcqsai.com/sitemaps/jobs.xml`
  - `https://mcqsai.com/sitemaps/scholarships.xml`
  - `https://mcqsai.com/sitemaps/blog.xml`
  - `https://mcqsai.com/sitemaps/boards-1.xml`
- Then add rewrite rules so those same-domain paths proxy to the `generate-sitemap` edge function under the hood.

4. Update static SEO files
- Replace `public/sitemap.xml` so it no longer hardcodes Supabase cross-domain `<loc>` entries.
- Update `public/robots.txt` to remove the Supabase sitemap URL and reference only the canonical domain sitemap.

5. Routing/proxy implementation
- Add rewrite rules in `public/_redirects` for the sitemap child URLs to the edge function query variants.
- Example pattern:
  - `/sitemaps/static.xml -> /functions/v1/generate-sitemap?type=static`
  - `/sitemaps/boards-:page.xml -> /functions/v1/generate-sitemap?type=boards&page=:page`
- Keep public-facing XML on `mcqsai.com` while forwarding internally.

Files to modify
- `src/components/mock-tests/JobTestsTab.tsx`
- `supabase/functions/generate-sitemap/index.ts`
- `public/sitemap.xml`
- `public/robots.txt`
- `public/_redirects`

Technical notes
- The first issue is confirmed in code: the current background deficit calls do not send `forceNew`, and `sessionPayload.question_count` currently uses `options.questionCount`.
- The second issue is also confirmed: the sitemap index currently builds `<loc>` using `SUPABASE_URL/functions/v1/generate-sitemap`, which causes cross-domain sitemap discovery problems.
- I cannot execute the overwrite in this read-only mode, but the exact implementation path is clear and ready.
