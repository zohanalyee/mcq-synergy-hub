# Sitemap Hard-Fix + SEO Audit

## Part 1 — Sitemap Fix (deploy immediately)

**Problem:** `https://mcqsai.com/sitemap.xml` still serves an old index pointing to relative `/sitemaps/*.xml` paths that 404. Even though `public/sitemap.xml` was updated locally, the live build apparently doesn't match — we'll overwrite it again with the exact cross-domain index Google should see.

**Action:** Overwrite `public/sitemap.xml` with the exact 7-entry sitemap index pointing directly to the Supabase Edge Function URLs (`https://pzhvipkcssxrsxxljbbz.supabase.co/functions/v1/generate-sitemap?type=...`). No relative paths. This bypasses the React SPA router entirely.

After deploy, verify with:
```
curl -s https://mcqsai.com/sitemap.xml | head
```
Should return XML (not HTML), with `<loc>https://pzhvipkcssxrsxxljbbz.supabase.co/...` entries.

Also clean up `public/_redirects` — the `/sitemaps/*.xml` redirect rules are now dead weight (sitemap index no longer references those paths). Keep them as harmless fallback OR remove. Recommendation: **keep** in case Google has cached old URLs.

---

## Part 2 — SEO Audit Findings + Prioritized Fixes

### Audit summary

| Area | Status | Notes |
|---|---|---|
| Meta tags (title/desc/OG) on dynamic pages | OK | `SEOHead` used on Jobs, Scholarships, OpportunityDetail, Subjects, MockTests, SubjectContent, BlogPost |
| URL structure `/opportunity/<slug>-<uuid>` | OK | All link sites (`JobCard`, `ExternalOpportunitiesSection`, `Scholarships`, `Tenders`, `BoardResults`) use `generateSlugUrl()`. No raw-UUID links found. |
| H1 hierarchy | Mixed | OpportunityDetail uses H1 ✓. Subjects ✓. MockTests ✓. **Scholarships page top heading is `<h2>` not `<h1>`** (line 153). Some pages have multiple H2 with no H1. |
| Breadcrumbs on deep pages | Partial | BlogPost ✓, ScholarshipDetailPage ✓ (manual). **OpportunityDetail has no breadcrumb.** Jobs/Scholarships landing have `PageBreadcrumb`. |
| Image alt tags | Needs check | Placeholder images in OpportunityDetail likely missing alt; logo + decorative imgs across Header/cards need audit |
| Bundle size / code splitting | Bad | `src/App.tsx` eagerly imports ~40+ page components (Index, Subjects, MockTests, Jobs, Scholarships, AdminPanel, ExternalCuration, TestSession, all Tools, etc.). Only a few are `lazy()`. Initial JS bundle is huge → directly hurts mobile LCP/TBT. |
| Structured data | Partial | Organization/Website/FAQ schema present globally. Job posting + Scholarship schema missing on detail pages. |

### Prioritized fix list

**P0 — Sitemap (Part 1 above).** Impact: enables crawling of all dynamic URLs. ETA fix: 1 min. Indexing recovery: 1–4 weeks.

**P1 — Code-split route bundle.** Convert eager `import` of heavy/rare routes in `src/App.tsx` to `lazy()` + `Suspense`. Targets: `AdminPanel`, `ExternalCuration`, `TestSession`, `QuestionBank`, `AskDocument`, `CustomSyllabus`, `CustomQuizzes`, `SubmitContent`, all `tools/*` pages, `Profile`, `Feedback`, `Achievements`, `Reviews`, `Notifications`, `VerifyEmail*`, `CompleteProfile`, `ForgotPassword`, `ResetPassword`. Keep eager: `Index`, `Header` deps, `SignIn`/`SignUp`. **Expected impact: mobile Lighthouse +15–25 points (smaller initial JS, faster LCP/TTI).**

**P2 — Add JobPosting / Scholarship JSON-LD on `OpportunityDetail`.** Use `schema.org/JobPosting` for `type=job` and `schema.org/Scholarship` for `type=scholarship`. Include `title`, `description`, `datePosted`, `validThrough` (deadline), `hiringOrganization`/`provider`, `jobLocation`. Impact: Google rich results in Jobs/Scholarships search → significant CTR boost.

**P3 — Heading hierarchy fixes.**
- `src/pages/Scholarships.tsx` line 153: top scholarship card title `<h2>` is fine, but ensure the **page** has an `<h1>` above (verify in lines 80–120). If missing, add one inside `JobsHeader`-equivalent.
- `OpportunityDetail`: add a visible `<h1>` for the title (currently exists at line 129 ✓ — good).
- Audit any page using only `<h2>`/`<h3>` without an `<h1>`.

**P4 — Breadcrumbs on `OpportunityDetail`.** Add `PageBreadcrumb` (Home → Jobs/Scholarships/Tenders → Title). Also helps emit `BreadcrumbList` JSON-LD if `PageBreadcrumb` supports it; if not, add manually. Impact: better Google sitelinks display.

**P5 — Image alt + lazy-loading sweep.** 
- OpportunityDetail placeholder images: add descriptive `alt` (e.g., `alt={`${type} opportunity image: ${title}`}`).
- All `<img>` tags in cards (`JobCard`, `ExternalOpportunitiesSection`, Footer logo, Header logo): ensure `alt` and `loading="lazy"` (except above-the-fold logo).
- Convert the OG/share image and large hero placeholders to WebP if hosted by us; for Unsplash, append `&fm=webp&q=70&w=400` query params to placeholder URLs in `OpportunityDetail.tsx` (already 800px — drop to 400 for cards).

**P6 — Internal linking.** Add "Related Opportunities" section on `OpportunityDetail` (3–5 same-type items) — already exists in `BlogPost`. Boosts crawl depth + dwell time.

### Technical change list

Files to edit:
1. `public/sitemap.xml` — overwrite with exact 7-entry index (P0).
2. `src/App.tsx` — convert ~20 imports to `lazy()` (P1).
3. `src/pages/OpportunityDetail.tsx` — add JobPosting/Scholarship JSON-LD, breadcrumb, image alts, optimize Unsplash query (P2/P4/P5).
4. `src/pages/Scholarships.tsx` — verify/add page H1 (P3).
5. `src/components/jobs/JobCard.tsx` + `src/components/external/ExternalOpportunitiesSection.tsx` — alt + loading=lazy on images (P5).

### Expected impact

| Fix | Metric | Estimated change |
|---|---|---|
| P0 sitemap | Indexed pages | 50 → 500+ in 2–4 weeks |
| P1 code-split | Mobile Lighthouse | 53 → 70–80 |
| P2 JSON-LD | Job/Scholarship CTR | +30–60% on rich result snippets |
| P3/P4 hierarchy + crumbs | Crawl quality, sitelinks | qualitative |
| P5 images | Mobile LCP | -0.5 to -1.5s |

### Out of scope (note for later)

- Server-side rendering / pre-rendering for dynamic detail pages (would beat client-only meta tags — Google JS rendering is reliable but slow; consider Vite SSG or a prerender service later).
- Hreflang correctness audit for multilingual.
- Service worker / route prefetch tuning.

---

**On approval:** I'll execute P0 + P1 + P2 + P4 + P5 in one pass (P3 only if H1 actually missing after re-check). P6 can be a follow-up.
