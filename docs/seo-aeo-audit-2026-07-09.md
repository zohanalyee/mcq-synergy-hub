# MCQsAI.com — Comprehensive SEO + AEO Audit

**Date:** 2026-07-09
**Auditor:** SEO/AEO architecture review (audit-only — no fixes applied)
**Property:** https://mcqsai.com (React / Vite / Supabase / Cloudflare)
**Verification basis:** Live Google Search Console URL Inspection API, live crawl tests (Googlebot / GPTBot / Chrome UAs), source-code inspection, and the founder-supplied GSC export CSVs.

> ⚠️ This is an **audit report only**. No code, Cloudflare, WAF, DNS, robots, sitemap, or schema changes were made. Fixes will be executed section-by-section after explicit approval.

---

## Executive Summary (read this first)

1. **🔴 The Cloudflare 403 block is NOT fixed — it is live right now.** Google's own URL Inspection API reports the homepage as `pageFetchState: ACCESS_FORBIDDEN` / `coverageState: "Blocked due to access forbidden (403)"`, with the last successful crawl on **2026-06-28** (≈11 days stale). Googlebot, GPTBot, and even a normal Chrome user-agent all receive **403** on HTML pages, while `/robots.txt` returns 200. This is an **edge/WAF-layer block**, not a robots.txt or code problem. **Nothing else on this list matters until this is lifted** — all ~1,427 "access forbidden (403)" pages in GSC trace back to this single root cause.
2. **Robots.txt is healthy.** Google confirms `robotsTxtState: ALLOWED`. The 324 "blocked by robots.txt" pages in GSC are **intentional** (admin, auth, and query-param permutation blocks) — no accidental blocks found.
3. **Canonicalization is architecturally correct in code.** A single global canonical component emits one apex canonical, strips query strings/trailing slashes, and normalizes `class-N` segments. The "multiple canonical tags" GSC flag (2 pages) is almost certainly **stale pre-fix data** — it will clear on re-crawl once the 403 lifts.
4. **Duplicate meta descriptions are a prerender-injection gap, not a code gap.** The React templates already generate unique per-page descriptions, but the **static prerendered HTML** for board leaf pages ships the generic fallback description — which is what Google indexed. Fix belongs in the build-time meta injection, not the components.
5. **The www → apex redirect is a 302 (temporary); it should be a 301 (permanent)** so Google consolidates signals to the apex.
6. **AEO foundations are strong but incomplete.** `llms.txt` exists and is well-structured; JSON-LD is broad (Quiz, FAQPage, BreadcrumbList, Organization, JobPosting, Course-family). **Gaps:** IndexNow is entirely absent (High), and `hreflang` is missing despite en/ur/sd content.
7. **Site architecture is clean and shallow** (`/boards/:board/:class/:subject/:topic` = 4 levels, ≤4 clicks). Thin-content gating already exists (leaf pages with <5 approved MCQs ship `noindex`).
8. **Off-page authority is the long-term weak point** — near-zero high-quality inbound links. This is a marketing workstream, not a code fix.

---

## Master Issue Table

| # | Issue | Severity | Pages Affected | Root Cause | Recommended Fix |
|---|-------|----------|----------------|------------|-----------------|
| 1 | Cloudflare returns 403 to Googlebot/GPTBot/all HTML fetches | 🔴 Critical | ~1,427 (all HTML) | Edge WAF / Bot Fight Mode / security-level rule blocking page fetches at Cloudflare (robots.txt still served) | **On Cloudflare (founder):** locate & disable the blocking rule; add explicit allow for verified search/AI bots; re-verify via GSC "Test Live URL" |
| 2 | No monitoring/alert on WAF changes | 🔴 Critical | Whole site | Automation (AI agents / Make.com / n8n) may hold Cloudflare write access and silently re-add a block | Add a change-alert + audit-log gate before any tool can modify WAF; least-privilege API tokens |
| 3 | www → apex redirect is 302, not 301 | 🟠 High | All www URLs (254 "page with redirect") | Temporary redirect prevents signal consolidation | Change to permanent 301 at Cloudflare/host redirect rule |
| 4 | IndexNow not implemented | 🟠 High | Whole site | Protocol never set up | Add IndexNow key + ping Bing/Yandex on publish/update |
| 5 | Duplicate meta descriptions | 🟠 Moderate | 39 (board leaf/hub pages) | Build-time `inject-meta.mjs` ships fallback description on non-prerendered board routes; per-page desc only in client Helmet | Extend prerender/meta-injection to emit the unique template description into static HTML |
| 6 | Multiple `<meta description>` on a page | 🔴 High (GSC) | 2 | Static `index.html` description + injected/Helmet description both present on specific routes | De-dupe in `inject-meta.mjs` (upsert, not append) — verify in `dist/` |
| 7 | Title too long (>60 chars) | 🔴 High (GSC) | 2 | Template concatenation (`topic + subject + class + board + \| MCQsAI`) overflows on long names | Clamp/prioritize title tokens to ≤60 chars in template |
| 8 | Multiple canonical tags | 🔵 Low | 2 | Stale pre-fix crawl data (code now emits single canonical) | Verify in built HTML; re-crawl clears it — no code change likely needed |
| 9 | Missing hreflang for en/ur/sd | 🟠 Moderate | Bilingual pages | No hreflang emitted; language is a client `?lang=` param (which is also canonicalized away) | Decide language-URL strategy; add hreflang or keep single-language canonical |
| 10 | Thin auto-generated pages | 🟠 Moderate | Board topic leaves | MCQ-only pages lack supporting prose | Existing `noindex` gate is correct; add intro/explanation prose to promote borderline pages |
| 11 | No high-quality inbound backlinks | 🟠 Moderate | Whole domain | New domain, no off-page campaign | Guest posts, .edu.pk partnerships, directory + forum placements |
| 12 | Core Web Vitals not measurable | 🔵 Low (blocked) | Whole site | Origin 403 blocks PSI/Lighthouse field + lab runs | Re-measure after 403 is lifted; code-level items noted in §7 |

---

## Section 1 — Crawlability & Indexing (audited first)

### 1.1 Cloudflare / bot access — CONFIRMED STILL BLOCKING
Live crawl matrix (run during this audit):

| URL | Googlebot UA | GPTBot UA | Chrome UA |
|-----|-------------|-----------|-----------|
| `https://mcqsai.com/` | **403** | **403** | **403** |
| `https://www.mcqsai.com/` | **403** | **403** | **403** |
| `https://mcqsai.com/robots.txt` | 200 | 200 | 200 |

Google Search Console URL Inspection (authoritative, homepage):
```
verdict:          NEUTRAL
coverageState:    Blocked due to access forbidden (403)
pageFetchState:   ACCESS_FORBIDDEN
robotsTxtState:   ALLOWED
lastCrawlTime:    2026-06-28T14:00:26Z
crawledAs:        MOBILE
```
**Interpretation:** The block is at the Cloudflare edge (HTML pages 403; static `robots.txt` is edge-cached and passes). Because a plain Chrome UA is also blocked, this is likely an over-broad Bot Fight Mode / Super Bot Fight Mode / security-level / managed-WAF rule or an IP-reputation challenge — not a Googlebot-specific rule. **Do not touch Cloudflare in this audit step** — flagged for founder execution.

**Recommended verification sequence (founder, on Cloudflare):**
1. Security → WAF → Custom rules / Managed rules: find any rule matching bot UAs, `cf.client.bot`, ASN, or "known bots". Note the rule name/ID before changing.
2. Bots → disable "Bot Fight Mode" / tune "Super Bot Fight Mode" to *allow verified bots*.
3. Security level: drop from "I'm Under Attack" if set.
4. After change: GSC → URL Inspection → **Test Live URL** on the homepage + one deep page → expect `Crawled` / `pageFetchState: SUCCESSFUL`.

### 1.2 robots.txt — HEALTHY (no accidental blocks)
Every `Disallow` is intentional:
- Admin/auth surfaces: `/admin`, `/auth`, `/signin`, `/signup`, `/complete-profile`, `/verify-email*`, `/reset-password`, `/forgot-password`, `/test-session/*` ✅
- Query-param permutations: `/*?*count=`, `?timed=`, `?topic=`, `?difficulty=`, `?q=`, `?lang=`, `/subjects?*` ✅ (correctly kills infinite low-value duplicates while clean paths stay indexable)
- `Sitemap: https://mcqsai.com/sitemap.xml` present ✅

The **324 GSC "blocked by robots.txt" pages** map to these intentional rules — no fix required. The 5 "Indexed, though blocked by robots.txt" (non-critical) are legacy query-param URLs Google indexed before the block; they will drop naturally.

### 1.3 Canonical domain — 302 should be 301
Both `mcqsai.com` and `www.mcqsai.com` resolve; www 302-redirects to apex. **Apex is the intended primary** (matches canonical/og:url/sitemap). Change the redirect to **301 permanent**. GSC has both `https://mcqsai.com/` (URL-prefix) and `sc-domain:mcqsai.com` properties verified — keep the domain property as primary.

### 1.4 Redirect chains (254 "page with redirect")
Overwhelmingly the **www→apex** and legacy-path redirects. No loops observed in code (`GlobalCanonical` and sitemap are all same-origin apex). Converting www→apex to 301 collapses the bulk of this. Re-audit chains after the 403 lifts and Google re-crawls.

### 1.5 Sitemap — HEALTHY
Valid sitemap **index** at `/sitemap.xml` → 9 children, same-origin, build-time generated (`generate-sitemaps.mjs`) and guarded (`verify-sitemap.mjs` rejects cross-domain/incomplete):

| Child sitemap | URL count |
|---|---|
| boards-1.xml | 729 |
| jobs.xml | 103 |
| tools.xml | 62 |
| mock-tests.xml | 35 |
| blog.xml | 32 |
| static.xml | 22 |
| programmatic.xml | 21 |
| scholarships.xml | 12 |
| exams.xml | 6 |

**Action:** after 403 fix, confirm no `noindex` (thin) topic URLs leak into `boards-1.xml` (memory notes a ≥5-MCQ sitemap threshold already exists — verify it holds).

### 1.6 IndexNow — MISSING (High)
No IndexNow key/endpoint anywhere in the repo. Implement: host `<key>.txt` at root, ping `api.indexnow.org` on content publish/update from an edge function.

### 1.7 "Crawled/Discovered — currently not indexed" (143 + 86)
Root cause is **primarily the 403** (Google can't fetch to index) compounded by **thin content** on MCQ-only leaf pages. Once crawlable, prioritize adding supporting prose (see §6) to move these to Indexed.

---

## Section 2 — Canonicalization & Duplicate Content

- **Implementation is correct.** `src/components/seo/GlobalCanonical.tsx` is the single source of truth: apex-only, https, query-string stripped, trailing-slash stripped, `class-N` normalized so `/boards/x/9/...` and `/boards/x/class-9/...` share one canonical. `SEOHead.tsx` deliberately emits **no** canonical to avoid conflicts.
- **"Multiple canonical tags" (2 pages, Low):** stale pre-fix data — verify against built `dist/` HTML; expected to clear on re-crawl.
- **"Duplicate without user-selected canonical" (105) / "Alternative page with proper canonical" (243):** these are the **www duplicates + `?lang=` / numeric-vs-slug class variants**. The canonical logic already resolves them; the 302→301 fix (§1.3) plus a clean re-crawl will consolidate them.
- **Duplicate content clusters:** board/class/subject/topic pages are structurally similar with topic swapped — acceptable because each canonicalizes to itself and (once un-blocked) carries unique title/desc/schema. Differentiate borderline-thin ones with prose (§6).

---

## Section 3 — Metadata Quality

- **Titles:** template = `{topic} MCQs - {subject} Class {n} | {board}` + SEOHead's `| MCQsAI` suffix. **2 pages exceed 60 chars** on long board/subject names → clamp tokens.
- **Descriptions:** templates DO generate unique text (e.g. BoardTopic: *"Practice {topic} MCQs for {subject} Class {n} ({board}). Free online preparation with explanations."*). **But the 39 duplicates come from static HTML** — `inject-meta.mjs` only patches an allow-list of routes, so many board pages ship the generic `index.html` fallback (`"Free AI MCQ practice for NTS, FPSC…"` / `"Prepare smarter with MCQSAI…"`), which is exactly what the FailingUrls CSV shows (5×+5×+4× identical). **Fix at build-time injection**, extending coverage to all board leaf/hub routes.
- **Multiple `<meta description>` (2, High):** `inject-meta.mjs` must **upsert** (replace) not append on those routes.
- **OG / Twitter:** present and per-page-driven via `SEOHead` + `GlobalCanonical` (og:url self-references). Apex og:image used deliberately (www 302 issue). ✅

---

## Section 4 — Structured Data / Schema / AEO

**Present (valid JSON-LD found in source):** `Quiz`, `FAQPage`, `Question`/`Answer`, `BreadcrumbList`, `Organization`, `JobPosting`, `Scholarship`, `HowTo`/`HowToStep`, plus monetary/place types for jobs. Board topic pages emit `Quiz` + breadcrumb.

**Gaps / recommendations:**
- Add **`FAQPage`/Q&A schema on MCQ leaf pages** (each MCQ = Question/Answer) so AI answer engines can cite mcqsai.com directly. (One FAQPage per page — memory already warns against duplicate FAQPage.)
- Consider `Course` / `EducationalOccupationalCredential` on exam landing pages (MDCAT/ECAT/CSS) for richer eligibility.
- **`llms.txt` — present and good** (`public/llms.txt`): clear H1, blockquote summary, sectioned links, Optional section. Minor: add exam sub-pages once un-blocked.
- **Validation:** cannot run Rich Results Test live while origin 403s — re-run after unblock.
- **Semantic HTML / H1:** memory confirms single-H1 + sequential-heading discipline; spot-check leaf templates post-fix.

---

## Section 5 — Site Architecture & Internal Linking

- **Hierarchy (clean, shallow):** `/boards → /boards/:board → /boards/:board/:class → …/:subject → …/:topic` — 4 levels, ≤4 clicks from home. Job/scholarship content correctly separated under `/jobs` and `/scholarships` (own sitemaps), so core educational content isn't miscategorized. ✅
- **Internal linking:** hub pages (Board/Class/Subject) link down to children (subject cards, topic lists) — good crawl distribution. **Recommendation:** add "related topics" and "next/previous chapter" links on leaf pages to spread equity and aid discovery.
- **Breadcrumbs:** `PageBreadcrumb` + `BreadcrumbSchema`/`BreadcrumbList` present and used on board/blog/detail pages — visual breadcrumbs match schema. ✅

---

## Section 6 — Content Quality & Thin Content

- **Thin-content gating already correct:** `BoardTopicPage` sets `noindex` when the topic isn't in `INDEXABLE_TOPIC_PATHS` (the <5-approved-MCQ gate) — prevents junk indexing.
- **To promote borderline pages:** add per-template supporting prose — a 60+ word unique intro, a short topic explanation, then the MCQ set + related links. Avoid a single boilerplate paragraph reused verbatim (memory already enforces unique meta descriptions; apply the same to on-page intros).
- Most "Crawled/Discovered — not indexed" will resolve once (a) crawlable again and (b) leaf pages carry supporting text.

---

## Section 7 — Performance & Core Web Vitals

- **Cannot measure live** — PSI/Lighthouse and CrUX field data are unavailable while the origin 403s. Re-run after §1 fix.
- **Code-level positives:** content-hashed assets with 1-year immutable cache (`_headers`), fonts preloaded + `display=swap` + non-blocking load, GA4 loaded async after main bundle, Supabase/GTM preconnects, route-level `Suspense` lazy-loading, build-time prerender for SEO routes.
- **Watch items:** AdSense script (`adsbygoogle.js`) loads `async` in `<head>` — verify it isn't render-blocking on mobile; confirm images use lazy-loading + next-gen formats + alt text (alt also aids AEO/accessibility); confirm Cloudflare caching doesn't serve stale HTML after deploys.

---

## Section 8 — Mobile & Pakistan Relevance

- **Mobile:** unified responsive design (single theme-aware layout, no separate mobile pages) per project standard — good for mobile-first indexing (Google crawls as MOBILE here).
- **Bilingual:** en/ur/sd supported via `LanguageContext`, but **no `hreflang`** and language is a client `?lang=` param that canonical strips. Decide: either (a) keep one canonical language per URL (current effective behavior) and drop the ambiguity, or (b) introduce language-pathed URLs + reciprocal hreflang. Current setup won't rank distinct-language variants separately.
- **Local:** `Organization` schema present; set/confirm Pakistan country targeting in GSC (domain property) and NAP consistency on Contact/About.

---

## Section 9 — Off-Page / Authority

Near-zero high-quality backlinks (GSC "lacks inbound links from high-quality domains"). Realistic PK-edtech channels:
- Guest posts on Pakistani education blogs; outreach to `.edu.pk` institutions for resource-page links.
- Reputable directory listings (education/edtech).
- Genuine value-add answers on student forums, Quora, and relevant subreddits linking to specific topic pages.
- Bing Places / Google Business Profile if a physical/organizational presence applies.
- Long-term: publish original, linkable study guides (blog already exists) targeting MDCAT/ECAT/CSS informational queries.

---

## Section 10 — Security ↔ SEO Intersection (project-specific)

- **Active block confirmed (see §1.1)** — a Cloudflare edge rule is currently 403-ing legitimate crawlers *and* real browsers from datacenter IPs. Document the exact rule name/ID when located, before disabling.
- **Governance gap:** if any automation (AI agent, Make.com, n8n, or a broad API token) can write to Cloudflare, it can silently re-introduce a blocking rule — which is the most likely way this recurred in June 2026.
  - Restrict Cloudflare API tokens to least privilege; remove WAF-edit scope from automations that don't need it.
  - Enable Cloudflare **Audit Logs** review + a change alert (email/webhook) on any WAF/Bot/Firewall rule change.
  - Add a human-approval checkpoint before any tool modifies WAF settings going forward.

---

## Prioritized Master Fix List

**🔴 Critical (do first — everything depends on these)**
1. Lift the Cloudflare 403 on HTML pages; allow verified search/AI bots (founder, Cloudflare side).
2. Add WAF change-alert + least-privilege tokens so it can't silently recur.

**🟠 High**
3. www → apex: convert 302 to **301 permanent**.
4. Fix build-time meta injection: unique description on **all** board leaf/hub routes + **upsert** (kill double descriptions) + clamp titles to ≤60 chars.
5. Implement **IndexNow** (key file + ping on publish/update).

**🟡 Moderate**
6. Add supporting prose to borderline-thin leaf pages; keep the <5-MCQ `noindex` gate.
7. Add MCQ-level FAQ/Q&A schema for AEO citation.
8. Decide hreflang / language-URL strategy for en/ur/sd.
9. Begin off-page backlink campaign.

**🔵 Low**
10. Verify (don't assume) the 2 "multiple canonical" pages in built HTML; re-crawl should clear them.
11. Re-measure Core Web Vitals after the 403 is lifted; act on findings then.

---

*Next step: on your approval, we execute section-by-section — starting with re-verifying the Cloudflare fix (which you apply on Cloudflare), then the build-time meta-injection and IndexNow work in this codebase.*
