# SEO/AEO Re-Audit — mcqsai.com (4 Aug 2026)

Live evidence: Google Search Console (property `https://mcqsai.com/`, URL Inspection + Performance + Sitemaps API), Semrush backlinks, raw-HTML fetches with Googlebot/Bingbot/GPTBot/ClaudeBot/PerplexityBot user agents, project source, and `cron.job`.

---

## 1. Executive summary (plain language)

Good news first: the site is healthy where it matters most. The homepage, `/subjects`-style hubs that Google has already crawled, board topic pages, and the money page `/mock-tests/junior-office-associate-bps-13` are all **"Submitted and indexed"**, canonical is picked as apex `https://mcqsai.com`, Quiz + FAQPage + Breadcrumb schema is visible in raw HTML to non-JS crawlers, crawler access returns 200 for Google, Bing and the AI bots, the sitemap index is clean (1,024 URLs, 0 errors, downloaded 3 Aug), and IndexNow fires every 15 minutes.

Two real problems explain "pages not indexing" — and neither is "just wait":

**Problem 1 — a historic Cloudflare 403 wave is still frozen in Google's index.** Google's stored state for `/exams/mdcat`, `/p/mdcat-karachi`, `/blog/...` and `/opportunity/...` is **"Blocked due to access forbidden (403)"**. Every one of those failed fetches is dated **12 Jun – 18 Jul**. Every page Google fetched **after ~20 Jul** succeeded (27 Jul, 28 Jul, 2 Aug, 3 Aug). So the block itself is fixed, but Google does not automatically re-try a 403 page quickly — those URLs sit in a blocked state until they are re-crawled, and nothing is currently pushing Google to re-crawl them (IndexNow only serves Bing/Yandex; Google ignores it).

**Problem 2 — six important hub pages are serving the homepage's `<head>` to crawlers, including a canonical that points at the homepage.** `/subjects`, `/mock-tests`, `/question-bank`, `/custom-syllabus`, `/study-guides` and `/leaderboard` are in the sitemap but missing from the prerender list, so a non-JS crawler gets the homepage title, the homepage description, and `rel=canonical → https://mcqsai.com/`. That is a self-inflicted instruction to Google to *drop those URLs and credit the homepage instead*. `/mock-tests` currently earns 8 clicks / 191 impressions while telling Google it is not a page.

On ranking movement: what GSC shows is **not a sitewide technical decline**. 197 clicks / 2,413 impressions / avg position 7.0 over 4 Jul – 31 Jul, with ~66% of clicks on a single page. With a portfolio that concentrated and a Semrush Authority Score of 2/100, day-to-day position moves of ±3 are normal SERP noise, not a bug. The genuine technical drags on ranking are the homepage-canonical bug, the frozen 403 states, and the fact that `?lang=ur` pages that are actively ranking are now blocked in robots.txt.

One thing to be aware of that was never flagged before: the backlink profile is **11 referring domains, and almost all of them are spam PBN/link-shortener domains** (`atomizelink.icu`, `byteshort.xyz`, `nivira.shop`) with anchors like *"buy backlinks online cheap"*. Nobody bought these deliberately, presumably — but they are the entire link profile right now.

---

## 2. Verification of previously-completed work

| Item | Status | Evidence |
|---|---|---|
| Cloudflare / crawler access | **PASS (now)** | 200 for Googlebot, Bingbot, GPTBot, ClaudeBot, PerplexityBot; GSC homepage `pageFetchState: SUCCESSFUL`, crawled 2 Aug. Historic 403s remain frozen in the index (see I-1). |
| Canonical `class-N` normalization | **PASS** | `/boards/sindh-text-book-board/class-11/biology-class-11/enzymes` → user canonical = Google canonical = self. `GlobalCanonical` strips query + normalizes class segment. |
| Meta descriptions unique on hubs | **PARTIAL FAIL** | `/tools`, `/boards`, `/blog`, `/faq`, `/exams/mdcat` unique. `/subjects` and `/mock-tests` serve the homepage description verbatim (prerender gap). Also a double-escape bug: `Matric &amp;amp; FSc`. |
| Quiz + FAQPage schema for non-JS crawlers | **PASS** | Raw Googlebot fetch of a topic page: `Quiz`, `FAQPage`, 10×`Question`/`Answer`, `Organization`, `WebSite`, `SearchAction` all present in static HTML. GSC rich results verdict PASS (Breadcrumbs detected). |
| IndexNow | **PASS (as designed)** | `indexnow-submit-recent` cron `*/15 * * * *` active. Caveat: IndexNow is Bing/Yandex only — it does nothing for Google. |
| Internal linking (D3) | **PASS** | GSC `referringUrls` for `/subjects` show real internal links from subject, opportunity and tools pages. |
| Sitemaps | **PASS** | 1,024 URLs, 0 errors, 0 warnings, last downloaded 3 Aug. (`indexed: 0` in the API is a long-deprecated field — ignore it.) |

---

## 3. Not-indexed pages — live data and root causes

Per-URL states pulled from URL Inspection today:

| URL sampled | Google's state | Last fetch |
|---|---|---|
| `/mock-tests/junior-office-associate-bps-13` | Submitted and indexed | 3 Aug ✅ |
| `/subjects` | Submitted and indexed | 28 Jul ✅ |
| `/boards/.../class-11/biology-class-11/enzymes` | Submitted and indexed | 27 Jul ✅ |
| `/exams/mdcat` | **Blocked due to access forbidden (403)** | 12 Jun |
| `/opportunity/two-years-apprenticeship-program-...` | **Blocked (403)** | 27 Jun |
| `/blog/mdcat-preparation-strategy-2026` | **Blocked (403)** | 12 Jul |
| `/p/mdcat-karachi` | **Blocked (403)** | 18 Jul |
| `/boards/aga-khan.../class-10/biology/biotechnology` | Discovered – currently not indexed | never fetched |
| `/tools/age-calculator` | **URL is unknown to Google** | never |

Root cause per category:

- **Blocked (403)** — a Cloudflare bot-management/challenge wave between roughly 12 Jun and 18 Jul returned 403 to Googlebot on non-homepage URLs. Fixed, but the state persists until re-crawl, and Google's retry cadence for 403 is slow. Fix = force re-discovery, not waiting.
- **Discovered – currently not indexed** (bulk of the 729 board topics) — classic crawl-budget rationing on a domain with Authority Score 2 and 11 referring domains. Google knows the URL, has decided it is not worth fetching yet. Fix = authority + internal-link depth + thin-page pruning, so the crawl budget is spent on pages that can win.
- **URL unknown to Google** (`/tools/*`, 62 URLs) — in the sitemap but Google has never even queued them. They sit behind the `/tools` hub with no links from indexed content, and each one is a thin utility page. Fix = decide deliberately which tools deserve index inclusion, link those from indexed pages, and drop the rest from the sitemap.
- **Homepage-canonical hubs** — `/subjects`, `/mock-tests`, `/question-bank`, `/custom-syllabus`, `/study-guides`, `/leaderboard` instruct Google to consolidate into `/`. They will eventually report "Alternate page with proper canonical tag" and lose their own listings. This is the single highest-value fix in the whole audit.
- **`?lang=ur` pages** — two Urdu URLs are actively earning clicks, yet `robots.txt` line `Disallow: /*?*lang=` blocks crawling of exactly that pattern. They become "Indexed, though blocked by robots.txt" and will freeze at their current snapshot.
- **`www.` duplicate** — GSC referring URLs include `https://www.mcqsai.com/tools`, so the redirecting host is still being crawled and burning budget.

---

## 4. Ranking fluctuation — is it real?

GSC 4 Jul – 31 Jul: 197 clicks, 2,413 impressions, CTR 8.16%, avg position 7.0.

- 130 of 197 clicks (66%) come from `/mock-tests/junior-office-associate-bps-13`; the top 10 queries are all "junior office associate" variants. When one page carries the site, its normal ±2–3 position wobble reads as "roz roz rank down".
- Avg position 7.0 on Pakistan-only long-tail queries with 11 referring domains is exactly where a low-authority site sits. There is no signature of a technical penalty: robots state ALLOWED, indexing ALLOWED, fetch SUCCESSFUL, canonical self-referencing, schema PASS.
- The verdict: **mostly normal fluctuation**, amplified by extreme concentration on one page. The technical component that *is* real and *is* fixable: homepage-canonical hubs (dilutes `/mock-tests`, the hub feeding the money page), frozen 403 pages (removes an entire tier of supporting content), and robots-blocked Urdu URLs.
- Note on measurement: this snapshot is a single 28-day window. Trend claims need a period-over-period comparison, which needs a separate GSC query.

---

## 5. Semrush findings (and an honest limitation)

**Limitation:** Semrush has no Pakistan database, and `mcqsai.com` returns *no data* in the `us` database. Keyword-gap and competitor-traffic comparison are therefore not meaningful for this site — `us` volumes come back as 10–20/mo for terms that clearly drive real Pakistani traffic (GSC shows 2,413 impressions of demand Semrush cannot see). Trust GSC over Semrush for keywords here.

**What Semrush does give reliably — backlinks:**

- Authority Score **2/100**, Trust Score **2/100**
- 14 backlinks / **11 referring domains** / only 4 IPs / 4 follow, 10 nofollow
- Referring domains are near-entirely spam: `atomizelink.icu`, `byteshort.xyz`, `nivira.shop`, `buzzshrink.website`, `anchorurl.cloud`, `metamagic.top`, `creativeposts.top`
- Anchor text includes *"high quality dofollow backlinks da 50 pa 40 premium pbn network service mcqsai.com rank first page google fast seo link building buy backlinks online cheap"*

This is the real ceiling on rankings. Not the code.

---

## 6. Master issue table

| # | Issue | Severity | Root cause | Fix |
|---|---|---|---|---|
| I-1 | 6 hub pages serve homepage `<head>` + `canonical → /` to crawlers | **Critical** | `/subjects`, `/mock-tests`, `/question-bank`, `/custom-syllabus`, `/study-guides`, `/leaderboard` are in the sitemap but absent from `PRERENDER_ROUTES` in `vite.config.ts` | Add all six to `PRERENDER_ROUTES`; extend `verify-prerender.mjs` to assert every `static.xml` URL is prerendered and self-canonical, so this can never regress |
| I-2 | Legacy "Blocked (403)" states across `/exams/*`, `/blog/*`, `/opportunity/*`, `/p/*` | **Critical** | Cloudflare challenge wave 12 Jun – 18 Jul returned 403 to Googlebot; Google has not re-crawled | Bump `lastmod` on affected sitemaps to force re-download, re-submit the sitemap index, and manually Request Indexing on ~10 tier-1 URLs (`/exams/*`, top blog posts) in Search Console; verify a green fetch before scaling |
| I-3 | Ranking Urdu URLs blocked by robots.txt | **High** | `Disallow: /*?*lang=` blocks `?lang=ur` pages that are currently earning clicks | Allow `?lang=` crawling (canonical already strips the query, so no duplicate risk) and keep the other param blocks |
| I-4 | Backlink profile is spam PBN only, AS 2/100 | **High** | Zero legitimate link acquisition; PBN links pointing in | Disavow the spam domains; start a small real-link programme (Pakistani education directories, board/exam resource pages, teacher forums) |
| I-5 | 62 `/tools/*` URLs "unknown to Google" | **Medium** | Thin utility pages, no internal links from indexed content, crawl budget rationed | Pick the ~10 tools with genuine search demand, give each real content + links from indexed pages, drop the rest from the sitemap |
| I-6 | Bulk of 729 board topics "Discovered – not indexed" | **Medium** | Crawl budget vs domain authority; thin topics compete with strong ones | Tighten the existing thin-page threshold (raise the approved-MCQ minimum for sitemap inclusion), add topic→sibling-topic internal links, let authority work (I-4) |
| I-7 | `www.mcqsai.com` still crawled | **Medium** | Historic links/references to the redirecting host | Confirm the 301 (not 302) apex redirect at the edge; purge remaining `www.` references in content |
| I-8 | Double-escaped entity in descriptions (`&amp;amp;`) | **Low** | Description string escaped twice before injection | Single-escape in the meta-injection path |
| I-9 | `/exams` and `/exams/pms` prerendered but missing from `exams.xml` | **Low** | Sitemap generator route list drifted from prerender list | Sync `generate-sitemaps.mjs` with `PRERENDER_ROUTES` and assert parity in `verify-sitemap.mjs` |
| I-10 | Core Web Vitals not measured against live data | **Low** | No field-data source reviewed in this audit | Read CrUX/PSI for the top 5 traffic URLs before touching performance code — no speculative optimisation |
| I-11 | Hreflang absent while `?lang=ur/sd` exists | **Low** | Language is a query param, canonical strips it — so Urdu content has no indexable URL of its own | Decide deliberately: either keep English-only indexing (current, acceptable) or move to `/ur/...` path URLs with hreflang. Do not add hreflang to query-param URLs |

---

## 7. Phase-wise fix plan

**Phase 1 — Stop the bleeding (cheap, highest ROI): I-1, I-3, I-8, I-9**
Add the six missing routes to `PRERENDER_ROUTES`, extend `verify-prerender.mjs` to fail the build if any `static.xml` URL is not prerendered with a self-canonical, unblock `?lang=`, fix the double-escape, sync the sitemap/prerender route lists. Then publish. Verification: raw Googlebot fetch of all six routes shows a self-canonical and its own title/description.

**Phase 2 — Force re-discovery of the 403 tier: I-2**
Bump `lastmod` on `exams.xml`, `blog.xml`, `programmatic.xml`, `jobs.xml`, re-submit the sitemap index via the Search Console API, and manually Request Indexing on ~10 tier-1 URLs. Re-inspect the same sample after 7–10 days and confirm the state flips from "Blocked (403)" to fetched. Nothing here should be declared fixed until GSC shows a successful fetch.

**Phase 3 — Off-page and authority: I-4**
Build the disavow file from the Semrush referring-domain list, submit it, and start a real link programme. This is the ceiling-raiser; without it, Phases 1–2 only clean up the plumbing.

**Phase 4 — Crawl-budget quality: I-5, I-6, I-7**
Tools triage (keep ~10, prune the rest from the sitemap), tighten the board-topic sitemap threshold, add sibling-topic internal links, confirm the apex redirect is a 301.

**Phase 5 — Measured performance + language decision: I-10, I-11**
Pull real CrUX/PSI field data for the top 5 URLs first, fix only what the data names. Then take the Urdu decision explicitly — English-only indexing is a valid answer, and `/ur/` path URLs are a separate project, not a tweak.

---

## 8. Approval needed

I need two decisions before Phase 1:

1. **Phase 1 scope** — do all five items (I-1, I-3, I-8, I-9 + the build-time guard), or just the critical canonical fix (I-1) to keep credits low?
2. **Urdu indexing (I-11)** — English-only indexing (no change), or plan `/ur/...` path URLs with hreflang as a later phase?
