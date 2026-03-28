

# SEO Status Audit & Pending Work Plan

## What's Already Done
- **Tools SEO (Item 1)**: FULLY COMPLETE. All 53 tools have `seoDescription` + `howToUse` in `toolsData.ts`. `ToolWrapper.tsx` renders SEOHead, JSON-LD WebApplication schema, How-to-Use guide, and Related Tools sidebar. Sitemap includes all 53 tool URLs via `?type=tools`.
- **Boards SEO**: Complete (2000+ programmatic pages with dynamic sitemaps)
- **Dynamic sitemaps**: Complete (index, static, blog, boards, tools)
- **Meta tags automation**: SEOHead used across 26+ pages
- **Structured data**: StructuredData.tsx + per-page JSON-LD

## What's Still Pending

### 1. Jobs Page SEO (no detail pages exist)
The `/jobs` page has basic SEOHead but lacks:
- **Individual job detail pages** (`/jobs/:jobSlug`) -- no route or component exists
- **Category pages** (`/jobs/category/:category`) -- no route exists
- **JSON-LD JobPosting schema** on detail pages
- **Sitemap entries** for job URLs

**Plan:**
- Create `src/pages/JobDetailPage.tsx` with SEOHead, JSON-LD `JobPosting` schema, breadcrumbs
- Create `src/pages/JobCategoryPage.tsx` for category landing pages
- Add routes in App.tsx: `/jobs/:jobSlug` and `/jobs/category/:category`
- Add `type=jobs` handler in generate-sitemap edge function (query `content_items` where `category='job'` + `external_opportunities` where `type='job'`)

### 2. Scholarships Page SEO (no detail pages exist)
Same situation as Jobs:
- **Individual scholarship detail pages** (`/scholarships/:slug`) -- missing
- **No JSON-LD Scholarship schema**
- **No sitemap entries**

**Plan:**
- Create `src/pages/ScholarshipDetailPage.tsx` with SEOHead, JSON-LD schema
- Add route `/scholarships/:slug` in App.tsx
- Add `type=scholarships` handler in sitemap edge function

### 3. Competitive Tests Landing Pages (no dedicated pages)
Currently MDCAT/ECAT/CSS are only mentioned in meta tags and subject descriptions. No dedicated landing pages exist.

**Plan:**
- Create `src/pages/exams/ExamLandingPage.tsx` -- a template component that takes exam type as param
- Create static data file `src/data/examData.ts` with SEO content for each exam (MDCAT, ECAT, CSS, PPSC, FPSC, NTS) including description, subjects, eligibility, tips
- Add routes: `/exams/mdcat`, `/exams/ecat`, `/exams/css`, `/exams/ppsc`, `/exams/fpsc`, `/exams/nts`
- Each page gets: SEOHead, JSON-LD `Course` schema, subject links, related MCQs CTA
- Add these URLs to static sitemap

### 4. Main Pages Polish
Current state: All main pages already have SEOHead with titles/descriptions/keywords. Minor improvements needed:

**Home (`Index.tsx`):**
- Add JSON-LD `WebSite` + `Organization` schema (currently only in StructuredData.tsx which may not render on Index)
- Verify StructuredData component is mounted

**About (`About.tsx`):**
- Add JSON-LD `AboutPage` schema
- Add `keywords` prop (already has basic ones)

**Contact (`Contact.tsx`):**
- Add JSON-LD `ContactPage` schema with contact points

**FAQ (`FAQ.tsx`):**
- Already has JSON-LD FAQPage schema -- DONE
- Could expand with more FAQ items via admin panel (not a code change)

---

## Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/pages/JobDetailPage.tsx` | Individual job page with SEO |
| Create | `src/pages/JobCategoryPage.tsx` | Job category landing page |
| Create | `src/pages/ScholarshipDetailPage.tsx` | Individual scholarship page with SEO |
| Create | `src/data/examData.ts` | Static SEO content for 6 exam types |
| Create | `src/pages/exams/ExamLandingPage.tsx` | Template for MDCAT/ECAT/CSS/etc. pages |
| Modify | `src/App.tsx` | Add 8+ new routes |
| Modify | `supabase/functions/generate-sitemap/index.ts` | Add jobs + scholarships + exams sitemap types |
| Modify | `public/sitemap.xml` | Add new sitemap entries |
| Modify | `src/pages/Index.tsx` | Ensure StructuredData renders |
| Modify | `src/pages/About.tsx` | Add JSON-LD AboutPage schema |
| Modify | `src/pages/Contact.tsx` | Add JSON-LD ContactPage schema |

## Implementation Priority
1. Competitive Tests pages (highest SEO value -- MDCAT/ECAT keywords are high-traffic)
2. Jobs detail pages (already have data in DB)
3. Scholarships detail pages (already have data in DB)
4. Main pages polish (quick wins)

