# Batch 9: Crawl safety (status and remaining steps)

## Where we are
Batch 9 was approved earlier today and is **already built and tested** (all 1,638 sitemap addresses matched a real page, none fell into "not found"). It is **not published yet**: the live site still shows the old "Page Not Found" screen, and `/mock-tests/junior-office-associate` does not forward yet.

## Blank-page fix: live checks (done now, 10:56 UTC)
- Pages (`/`, `/exams`, a wrong address): `cache-control: no-cache`. **Pass**: your Cloudflare rule works.
- Code file `/assets/index-FPnRwBPp.js`: `public, max-age=31536000, immutable`. **Pass**: the 1-year setting is kept.
- Blank-page safety net script is in the live homepage. **Pass**.

## Your questions, answered
- **Real "404 Not Found" status: not possible here.** Lovable hosting always sends the homepage file with "OK" for unknown addresses, and ignores redirect and header files. Cloudflare Free rules can change headers and do redirects, but cannot turn "OK" into "404". Only a Cloudflare Worker could, which you excluded.
- **Best option on our setup (already built):** a "not found" page marked noindex, with search, 6 popular tests and the exam hubs. Google treats it as a soft 404 and drops it. Wrong mock-test and exam-guide addresses show the same page.
- **A pre-built /404 page would not help.** The host never serves it for wrong addresses; it always serves the homepage file.
- **Junior Office Associate:** forwards instantly to `...-bps-13`, keeping tags like `utm_source`. A Cloudflare redirect rule would be slightly stronger, but needs no code. Optional: Rules → Redirect Rules → if path equals `/mock-tests/junior-office-associate` → 301 to `https://mcqsai.com/mock-tests/junior-office-associate-bps-13`, keep query string.
- **Other wrong slugs:** none found. Every mock-test link written into our pages exists, and the database check (featured cards, exam pages, blog posts) found 0 links to missing pages. Search Console's "Not found" list can reveal more; send any you see.

## What happens after you publish
1. You: Publish, then Cloudflare Purge Everything, then tell me.
2. I check live: a wrong address shows the new page with noindex; the Junior Office Associate address forwards; caching headers and the safety net are still correct.

## Google effect, risk, undo
- **Effect:** wrong addresses drop out over the next weeks as soft 404s. The old Junior Office Associate address passes to the real test. No ranking promise.
- **Risk:** low. Simple crawlers still see homepage text for wrong addresses (a host limit). A real page wrongly showing "not found" is blocked by the sitemap test, which runs on every publish.
- **Undo:** restore the previous version in Lovable history. The forward list is one small file.

## Technical details
- Built files: `src/pages/NotFound.tsx`, `src/lib/legacyRedirects.js`, `src/routes/LegacyMockRedirect.tsx`, the `!test` branch of `MockTestDetail.tsx`, `scripts/route-coverage.test.mjs` and `scripts/check-db-links.mjs` (both added to the build).
- No further code is planned for Batch 9. Approving this plan only runs the post-publish live checks.
