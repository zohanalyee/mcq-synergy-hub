

# Complete SEO Implementation for MCQsAI

## Current State
- **No dynamic meta tags** -- single static `<title>` and meta in `index.html`; no per-page SEO
- **No `react-helmet-async`** installed
- **No sitemap.xml** exists
- **robots.txt** is minimal (no sitemap reference, no disallow rules)
- **No structured data** (JSON-LD)
- **Breadcrumb component** exists (`PageBreadcrumb.tsx`) but not widely used
- **SEOFields component** exists for admin content forms (not relevant here)
- **No `HelmetProvider`** in App.tsx

## Implementation Plan

### Step 1: Install react-helmet-async & wrap App
- Add `react-helmet-async` dependency
- Wrap the app tree in `<HelmetProvider>` inside `App.tsx` (above `<Router>`)

### Step 2: Create `SEOHead` component
**New file: `src/components/SEOHead.tsx`**

Reusable component accepting `title`, `description`, `keywords`, `image`, `url`, `type`, `noindex`. Uses `react-helmet-async` to inject:
- `<title>` with ` | MCQsAI` suffix
- `<meta name="description">`, `<meta name="keywords">`
- `<meta name="robots">`
- `<link rel="canonical">`
- Open Graph tags (og:title, og:description, og:image, og:url, og:type, og:locale, og:site_name)
- Twitter Card tags
- Hreflang alternates for en/ur/sd

Defaults tuned for Pakistani EdTech market (MDCAT, ECAT, CSS, PPSC, NTS keywords).

### Step 3: Create `StructuredData` component
**New file: `src/components/StructuredData.tsx`**

Renders JSON-LD scripts via Helmet for:
- `EducationalOrganization` schema
- `WebSite` schema with SearchAction
- `FAQPage` schema with common questions

Added once in `App.tsx` or Index page layout.

### Step 4: Add SEOHead to all major pages
Add `<SEOHead>` with page-specific title/description/keywords to:

| Page | Title | Key focus |
|------|-------|-----------|
| Index.tsx | Home -- AI-Powered MCQ Practice | MDCAT, ECAT, competitive exams |
| Subjects.tsx | Practice MCQs by Subject | Subject-wise practice |
| MockTests.tsx | Mock Tests & Exam Simulations | Competitive exam practice |
| CustomSyllabus.tsx | Custom Syllabus Builder | Custom test creation |
| Jobs.tsx | Latest Jobs in Pakistan | Job listings |
| Scholarships.tsx | Scholarships for Students | Scholarship listings |
| Tools.tsx | Free Student Tools | Calculators, converters |
| Analytics.tsx | Performance Analytics | Progress tracking |
| About.tsx | About MCQsAI | Company info |
| Contact.tsx | Contact Us | Support |
| Feedback.tsx | Feedback | User feedback |
| Quizzes.tsx | Online Quiz Practice | Quiz practice |
| Reviews.tsx | Student Reviews | Testimonials |
| Leaderboard.tsx | Leaderboard | Rankings |
| QuestionBank.tsx | Question Bank | Question repository |
| SubjectContent.tsx | Dynamic per subject | Subject-specific SEO |

Auth pages get `noindex: true`.

### Step 5: Create sitemap.xml
**New file: `public/sitemap.xml`**

Static sitemap covering all public routes (~25 URLs):
- `/`, `/subjects`, `/quizzes`, `/custom-syllabus`, `/jobs`, `/scholarships`, `/tools`, `/leaderboard`, `/reviews`, `/about`, `/contact`, `/question-bank`, `/past-papers`
- Key tool pages (calculators, converters)
- Subject pages (`/subject/biology`, `/subject/chemistry`, etc.)
- Legal pages

With `lastmod`, `changefreq`, and `priority` attributes.

### Step 6: Update robots.txt
**Modified file: `public/robots.txt`**

```text
User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/*
Disallow: /test-session/*
Disallow: /auth
Disallow: /signin
Disallow: /signup
Disallow: /complete-profile
Disallow: /verify-email*
Disallow: /reset-password
Disallow: /forgot-password

Sitemap: https://mcqsai.com/sitemap.xml
```

### Step 7: Update index.html defaults
- Update OG image URL from lovable.dev placeholder to `https://mcqsai.com/og-image.png`
- Ensure base meta tags are good defaults (they already are, SEOHead will override per-page)

### Files Changed Summary
- **New**: `src/components/SEOHead.tsx`, `src/components/StructuredData.tsx`, `public/sitemap.xml`
- **Modified**: `package.json` (add react-helmet-async), `src/App.tsx` (HelmetProvider + StructuredData), `public/robots.txt`, `index.html`, and ~16 page files for SEOHead integration

### Out of Scope (for later)
- Blog system (requires database tables and new pages)
- Google Analytics / Search Console setup (external configuration)
- Dynamic sitemap generation from database
- OG image generation

