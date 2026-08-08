# Batch-4 — AdSense Readiness Audit + Remaining SEO Items

Report first (no code yet). Findings below are verified from the project source: `index.html`, `public/robots.txt`, `public/sitemaps/static.xml`, `vite.config.ts` (`PRERENDER_ROUTES`), `src/components/Footer.tsx`, `src/App.tsx`, and the three legal pages.

---

## 1. AdSense Readiness Audit

### 1a. What is already in place (PASS)

| Item | State |
| --- | --- |
| AdSense loader script | Present in `index.html` head (`ca-pub-4978762286882236`, async + crossorigin) |
| Privacy Policy | Exists at `/privacy-policy`, prerendered, in sitemap, linked in footer. Has an explicit "Cookies & Advertising" section naming Google AdSense, the DoubleClick cookie, Google Ads Settings opt-out, and aboutads.info |
| Terms of Service | Exists at `/terms-of-service`, prerendered, in sitemap, footer-linked. Contains a clear "not affiliated with FPSC/SPSC/NTS" independence disclaimer |
| Editorial Policy | Strong page — sourcing, authorship, corrections SLA, independence/funding, explicit AI disclosure. This is exactly the E-E-A-T signal reviewers look for |
| About + Contact | Both exist, prerendered, sitemap + footer linked |
| Crawlability | `robots.txt` allows `/`, admin/auth/test-session correctly blocked, sitemap declared |
| Content volume | ~1,262 prerendered pages with real MCQ content visible in raw HTML |
| Thin-content gate | Board topic pages with <5 approved MCQs are already noindexed and excluded from sitemaps |

Bottom line: the site is **close to approval-ready**. There is no policy-violating content, the required legal pages exist, and content volume/originality are not the problem.

### 1b. Gaps that can cause rejection or lost revenue

| # | Gap | Severity | Why it matters |
| --- | --- | --- | --- |
| AD-1 | **`public/ads.txt` does not exist** | High | AdSense flags "Earnings at risk — ads.txt file missing". Trivial one-line file; blocks nothing but costs revenue and shows as a red warning in the AdSense dashboard |
| AD-2 | **Zero real ad units on the site.** `src/components/ads/AdBanner.tsx` is a dashed-border "Advertisement" placeholder and is imported by nothing | High | Reviewers need to see ad slots; the placeholder also looks like a broken/deceptive ad box if it ever renders |
| AD-3 | **No cookie-consent notice** | Medium | Required for EEA/UK traffic under Google's EU user consent policy. Pakistan-only traffic is low risk, but any EEA visitor is served personalised-ad cookies with no consent |
| AD-4 | **Privacy Policy missing 4 AdSense-expected clauses** | Medium | Age/children's policy (13+ is in ToS but not the Privacy Policy), data retention period, "we do not sell your personal data", how to exercise access/deletion rights (which email, what response time). Also missing an explicit Google Analytics/GA4 mention with its opt-out link |
| AD-5 | **ToS is thin (~6 short sections)** | Medium | No termination clause, no limitation-of-liability, no governing-law (Pakistan), no changes-to-terms clause, no third-party/advertising clause. Reviewers read this page |
| AD-6 | **No `/disclaimer` page** | Low | Education/exam sites benefit from an explicit "no guarantee of exam results, not official board material" page. Content currently sits inside ToS §5 only |
| AD-7 | **Placeholder-ish "Coming Soon" surfaces** (e.g. `/ask-document`) | Low | Under-construction pages are a classic manual-review rejection reason. Should be noindexed and unlinked from primary nav while empty |

### 1c. Proposed ad placements (UX-safe)

Rule applied throughout: **never inside an active exam**, never above the answer/utility, max 2 units per view on mobile, no sticky overlays.

| Surface | Placement | Format |
| --- | --- | --- |
| Board topic pages (`/boards/.../topic`) | One in-content unit after the topic intro/first MCQ block, one at the end above FAQ | Responsive in-article |
| Blog posts | One after the first section, one mid-article, one at end | In-article + multiplex at end |
| Mock test **results** screen | One below the score card, above "Recommended tests" | Responsive rectangle |
| Hubs (`/subjects`, `/mock-tests`, `/boards`, `/tools`) | One unit below the first card row | Responsive leaderboard |
| Programmatic `/p/*` and `/exams/*` | One after intro, one before FAQ | In-article |
| **Excluded entirely** | `/test-session/*` (live exam), auth pages, admin, dashboard, syllabus-builder while generating | — |

### 1d. Quick wins (fastest path to approval)

1. Create `public/ads.txt` (one line).
2. Replace the placeholder `AdBanner` with a real `<ins class="adsbygoogle">` component that renders nothing in dev/preview, and mount it on the 4 highest-traffic surfaces above.
3. Expand Privacy Policy with the 4 missing clauses (AD-4) and ToS with the 5 missing clauses (AD-5).
4. Add a lightweight cookie-consent banner (region-agnostic, dismiss-persisted) — small component, no backend.
5. Confirm every "Coming Soon" route is noindexed and not in the sitemap.

---

## 2. Remaining Batch-4 items

- **I-4 Backlink disavow** — build `disavow.txt` from the 11 Semrush referring domains (`atomizelink.icu`, `byteshort.xyz`, `nivira.shop`, `buzzshrink.website`, `anchorurl.cloud`, `metamagic.top`, `creativeposts.top`, …), re-pull the list fresh before writing so nothing legitimate is caught. Submission is a manual Search Console step — I will produce the exact file and instructions. Then a short real-link plan (Pakistani education directories, board/exam resource pages, teacher forums).
- **I-5 Tools triage** — identify the ~10 `/tools/*` pages with genuine demand, thicken them + link from indexed content, drop the rest from `tools.xml`.
- **I-6 Thin topics** — raise the approved-MCQ minimum for sitemap inclusion, add sibling-topic internal links.
- **I-7 www redirect** — confirm apex redirect is 301 (not 302) at the edge, purge remaining `www.` references.
- **I-10 Core Web Vitals** — pull real CrUX/PSI field data for the top 5 traffic URLs first, then fix only what the data names. No speculative optimisation.

---

## 3. Suggested execution order

1. **Phase A (AdSense quick wins)** — AD-1, AD-2, AD-4, AD-5, AD-7. Ship + publish.
2. **Phase B** — cookie consent (AD-3) + `/disclaimer` (AD-6).
3. **Phase C** — I-4 disavow file + link plan.
4. **Phase D** — I-5, I-6, I-7.
5. **Phase E** — I-10 (measure first).

---

## 4. Decisions needed before Phase A

1. **Ad density** — conservative (1 unit per page, safest for review) or standard (2–3 units on long pages, more revenue)?
2. **Ad unit type** — manual placements only (full control, matches the table above), or also enable Google Auto Ads (more revenue, less layout control)?
3. **Cookie consent** — include in Phase A, or defer to Phase B as listed?
4. **Legal copy** — should I draft the missing Privacy/ToS clauses myself using standard, non-committal wording (no certification or compliance claims), or will you supply the text?
