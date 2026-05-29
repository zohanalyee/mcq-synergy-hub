## Goal
Make social-share previews (WhatsApp, Facebook, X, LinkedIn, Discord) reliably show a banner on every page, by fixing the Open Graph + Twitter pipeline globally.

## Root cause (confirmed)
The live site serves on the **apex** `https://mcqsai.com` (HTTP 200). `https://www.mcqsai.com/*` **302-redirects** to apex. Social crawlers do **not** follow redirects on `og:image`. But several emitters point OG/canonical at `www`:
- `SEOHead` default image → `https://www.mcqsai.com/og-image.png` (redirects → no image on ~60 pages)
- `ToolWrapper` → `https://www.mcqsai.com/og-image.jpg` (redirects **and** the `.jpg` file does not exist → 404)
- `GlobalCanonical` emits `og:url` + `canonical` on `www` (a redirecting URL)
- `ToolRouteSEO` emits **no** `og:image` at all

Decisions confirmed by user: align canonical + og:url + og:image to **apex** everywhere, and create **per-category branded banners**.

## 1. Shared OG/URL helper (new `src/lib/seoUrls.ts`)
Single source of truth so future routes inherit valid metadata:
- `SITE_ORIGIN = "https://mcqsai.com"` (apex, no redirect).
- `absoluteUrl(path)` → builds clean absolute apex URL (strips query, trailing slash except root).
- `OG_IMAGES` map + `ogImageForPath(pathname)` implementing the fallback hierarchy: page-specific → category (jobs/scholarships/blog/tools/exams/boards) → global default. Always returns an absolute HTTPS apex URL.
- `assertOgImage(url)` dev-only helper: `console.warn` if image URL is missing, relative, or non-HTTPS (requirement #7).
- Header doc comment with the "checklist for new pages" (requirement #10).

## 2. Generate branded OG banners (1200×630 JPG, < 5MB) into `public/og/`
- `default-og.jpg`, `jobs-og.jpg`, `scholarships-og.jpg`, `blog-og.jpg`, `tools-og.jpg`, `exams-og.jpg`, `boards-og.jpg`.
- Consistent MCQsAI brand (Orbitron wordmark, violet/cyan gradient). QA each by inspecting the rendered file before finalizing.
- Keep existing `public/og-image.png` as the ultimate fallback.

## 3. Fix every OG emitter to use apex + full tag set
- **`src/components/SEOHead.tsx`**: default `image` → apex helper; add `og:image:secure_url`, `og:image:type`, `og:image:width`(1200)/`height`(630), `og:image:alt`; ensure og:title/description/image/type/url and twitter:card/title/description/image all present; run `assertOgImage`.
- **`src/components/seo/GlobalCanonical.tsx`**: switch canonical + og:url + twitter:url from `www` → apex (`https://mcqsai.com`). Now og:url === canonical exactly (requirement #8).
- **`src/components/seo/ToolRouteSEO.tsx`**: add `og:image`/`twitter:image` (tools banner) + image dimension tags — currently missing entirely.
- **`src/components/tools/ToolWrapper.tsx`**: replace broken `www…/og-image.jpg` with apex tools banner.
- Confirm `StructuredData.tsx` / `seo/schemas/index.tsx` already use apex `ORIGIN` (they do) — no change.
- **`index.html`**: already apex and complete — verify/keep as the static fallback every crawler sees.

## 4. Category defaults for raw-Helmet pages
Pages using raw `<Helmet>` without `og:image` (e.g. `Jobs`, `Scholarships` via SEOHead, `OpportunityDetail`, `JobDetailPage`, `MDCATSyllabus`, `PastPapers`, `MockTests`, `SindhUniversitiesEntryTest`) will pass the correct category image via `SEOHead`'s `image` prop or the helper, so each inherits a relevant banner instead of only the global default.

## 5. Server-visibility note (important, honest constraint)
`<Helmet>` only mutates the head client-side. Crawler-visible OG comes from either `index.html` (static) or the **prerender** whitelist in `vite.config.ts` (`PRERENDER=true`). 
- Prerendered routes (home, exams, tools landing, blog/jobs/scholarships index, SEO landing pages) → get full per-page OG in page source.
- Non-prerendered **detail** pages (individual blog post, job/scholarship detail, board sub-pages) fall back to `index.html`'s static apex banner — which now loads correctly (image always appears, generic). Per-detail server-side OG would require adding them to prerender/SSR; out of scope for this reliability fix unless you want it later.

## 6. Validation & docs
- Dev `console.warn` guards in the helper (missing/relative/non-HTTPS og:image).
- Verification checklist in `seoUrls.ts` comments for future routes.
- After build, spot-check a prerendered route's emitted head and confirm all banner URLs return HTTP 200 on apex (no redirect).

## Out of scope (unchanged)
Branding/layout, routing, auth, dashboards, MCQ engine, AI systems. This is strictly a metadata/social-preview reliability fix.