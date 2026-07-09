# MCQsAI.com — SEO + AEO Audit (Plan)

Audit-only. Deliverable is **one markdown file** written to the repo. No code, Cloudflare, WAF, DNS, robots, sitemap, or schema changes in this step — findings are flagged and prioritized only, execution happens after your section-by-section approval.

## Deliverable

`docs/seo-aeo-audit-2026-07-09.md` containing:

- Executive summary (5–8 plain-language bullets)
- Master issue table: `Issue | Severity | Pages Affected | Root Cause | Recommended Fix`
- All 10 sections you specified, each with findings + prioritized fixes
- A prioritized master fix list (Critical → High → Moderate → Low)

## Key evidence already gathered (live, not assumed)

**🔴 CRITICAL — the Cloudflare block is NOT fixed.** Google's URL Inspection API (queried just now against your verified GSC property) reports the homepage `https://mcqsai.com/`:

- `coverageState: "Blocked due to access forbidden (403)"`
- `pageFetchState: "ACCESS_FORBIDDEN"`
- `lastCrawlTime: 2026-06-28` (Googlebot has not successfully fetched a page in ~11 days)
- `robotsTxtState: ALLOWED` (so robots.txt is fine — the 403 is at the edge/WAF layer)

Independent crawl test confirms: `mcqsai.com` and `www.mcqsai.com` return **403 for Googlebot, GPTBot, and a normal Chrome UA alike**, while `/robots.txt` returns 200 (edge-cached). This points to a Cloudflare edge rule (WAF / Bot Fight Mode / Super Bot Fight Mode / security level) blocking HTML page fetches. **Every other SEO issue is secondary until this is lifted** — 1,427 "access forbidden (403)" pages in GSC trace to this single root cause.

**Domain / canonical:** GSC shows two properties (`https://mcqsai.com/` URL-prefix + `sc-domain:mcqsai.com`). `www.mcqsai.com` 302-redirects to apex (should be 301). `GlobalCanonical.tsx` already correctly emits a single apex canonical, strips query strings/trailing slash, and normalizes `class-N` segments — so the "multiple canonical tags" GSC flag is likely stale/pre-fix on 2 pages; will verify in built output.

**Metadata:** `index.html` static title is `MCQSAI | AI-Powered Exam Prep`; `SEOHead.tsx` appends `| MCQsAI`. The 39 identical meta descriptions map to board leaf pages falling back to the default description (confirmed in your FailingUrls CSV — same "Prepare smarter…" / "Free AI MCQ practice…" strings repeat). Root cause: board/class/subject/topic templates don't generate per-page descriptions. 2 "title too long" + 2 "multiple descriptions" are localized template issues.

**Sitemaps:** valid sitemap index with 9 children (boards-1=729 locs, tools=62, jobs=103, etc.), same-origin, build-time generated + verified. Healthy. Will cross-check for any noindex/404 URLs leaking in.

**AEO:** `llms.txt` exists and is well-structured. Prerendering is active (`PRERENDER=true` + inject-meta + verify scripts). Will audit JSON-LD (FAQPage/Course/Quiz/BreadcrumbList) coverage on leaf MCQ pages for citation-readiness. IndexNow is absent (confirmed) — flagged High.

## Audit method for the remaining sections

- Section 1/10 (crawl/security): document the confirmed 403 via GSC + curl matrix; enumerate robots.txt Disallow rules (already read — all intentional: admin/auth/query-param permutations); recommend WAF allowlist verification + change-alert control. **No Cloudflare changes made.**
- Section 2/3: parse your `FailingUrls` CSV to list exact URLs sharing descriptions; inspect built HTML for canonical/description uniqueness per template.
- Section 4: grep JSON-LD emitters (`StructuredData.tsx`, `BlogStructured.tsx`, board-topic components); list schema present vs missing.
- Section 5: map route hierarchy from `App.tsx`; check breadcrumb + internal linking on hub/leaf pages; confirm `/jobs` separation.
- Section 6: sample thin board-topic pages (<5 MCQ noindex gate already in memory) vs indexable ones.
- Section 7: Lighthouse/PSI note — cannot fully run while origin 403s; will assess bundle/image/lazy-load patterns from code and flag CWV items to re-measure post-unblock.
- Section 8/9: bilingual (`en/ur/sd`) + hreflang check; off-page backlink recommendations for PK edtech.

## Out of scope (this step)

No fixes applied. After you approve the report, we'll tackle fixes section-by-section starting with the Cloudflare 403 (which you'll execute on Cloudflare side, since I must not touch WAF/DNS).

&nbsp;

# **Great work — yeh audit-plan aur live findings bilkul sahi direction mein hain. Approved, please continue.**

Confirm kar raha hon:

1. Cloudflare/WAF 403 issue — main isay khud Cloudflare dashboard mein directly check/fix kar raha hon (aap sahi keh rahay hain, yeh aap k access mein nahi aata). Aap iska wait mat karein, apna baqi audit parallel mein continue karein. Jaise hi Cloudflare side se fix ho jaye, main aap ko bata don ga taake aap re-verify kar sakein k Googlebot ab successfully fetch kar pa raha hai.

2. Baqi sab sections (2 se 9 tak) jaisa aap ne plan kiya hai — same order mein continue karein:

   - Duplicate meta descriptions (39 pages) — exact URLs list karke unique per-template descriptions ka fix propose karein

   - www → apex redirect ko 302 se 301 mein convert karne ka fix bhi note kar lein

   - JSON-LD/schema audit (Section 4)

   - Route hierarchy + internal linking (Section 5)

   - Thin content sample check (Section 6)

   - CWV/performance code-level review (Section 7) — origin 403 hone ki wajah se abhi live test nahi ho sakta, jaisa aap ne kaha, wahi theek hai

   - Bilingual/hreflang + backlink recommendations (Section 8/9)

3. Deliverable same rahega: docs/[seo-aeo-audit-2026-07-09.md](http://seo-aeo-audit-2026-07-09.md) — executive summary, master issue table, sab 10 sections, aur prioritized fix list.

4. Abhi bhi koi code/Cloudflare/DNS/robots/sitemap change NA karein — sirf audit report complete karein. Jab report mujhe mil jaye, main section-by-section approval dun ga fixes k lae.

Shabash, continue karein.