# Plan — SSR audit, Pakistan Exam Hub, meta-description fixes, favicon lock

This plan groups your 5 requests into a single sequenced workflow. Items 1 and 3 are research/audit only (no code). Item 4 is a verification step. Items 2 and 5 are the only code changes.

---

## 1. SSR / prerendering audit (research, no code)

Deliverable: a written report posted in chat covering:

- **Render mode of mcqsai.com today** — confirm it is a pure client-side React SPA (Vite build, no SSR, no static prerender). Evidence will be the contents of `view-source:https://www.mcqsai.com/` — the `<div id="root">` should be empty, and no MCQ text should appear in the raw HTML. Will fetch the live HTML and quote the relevant lines.
- **What is in source vs. what needs JS** — list which SEO-critical elements are server-rendered (title, meta description, canonical from `index.html`) vs. JS-only (per-route Helmet tags, MCQ content, board/exam pages).
- **Lovable platform support** — check Lovable docs for prerendering / SSG / SSR options for the Vite + React stack.
- **Recommendation** — options ranked by effort: (a) keep CSR + rely on Googlebot JS rendering, (b) add a prerender service (Prerender.io / react-snap) at build time for the ~50 SEO landing routes, (c) migrate to a framework with SSR. No code changes in this step.

## 2. Pakistan Exam Intelligence Hub (`/pakistan-exam-hub`)

New public SEO landing page that aggregates live exam intel. Scope for v1 (static content + manually curated data, no scrapers yet):

- New file: `src/pages/seo/PakistanExamHub.tsx`
- New route in `src/App.tsx`: `/pakistan-exam-hub` (public, outside auth wrapper)
- Link added under a new "Exam Intelligence" section on `src/pages/Index.tsx`
- Sitemap entry in `public/sitemaps/static.xml`

Sections on the page (all static JSX, data hard-coded for now):
1. Hero — "Pakistan Exam Intelligence Hub 2026"
2. Upcoming test dates table (MDCAT Aug 16 2026, ECAT, PPSC, FPSC, NTS) — same data already in `examData.ts`
3. Aggregate calculators — link out to existing `/tools/marks-calculator`, `/tools/gpa-calculator`, `/tools/percentage-calculator`
4. Merit lists & answer keys — placeholder cards linking to `/board-results`
5. Admission deadlines list
6. Internal links to all `/exams/*` landing pages
7. `Course` + `FAQPage` JSON-LD via `<SEOHead>`

Out of scope for v1 (call out in plan, defer): live scraper-fed PPSC/FPSC notifications, real-time merit lists. Those need an `agent_tasks` scraper task; can be a follow-up.

## 3. EEAT author profiles + programmatic SEO (research, no code)

Deliverable: a written follow-up plan (separate `.lovable/plan.md` revision later) covering:

- Author bio component pattern (`src/components/AuthorBio.tsx`) + `Person` JSON-LD
- Which page types get bylines (blog posts, exam guides, syllabus pages)
- Programmatic SEO matrix: `{exam} × {city}` and `{subject} × {class} × {board}` route templates
- Merit/aggregate calculator pages list

No code in this turn — only flagged as a follow-up so you can prioritise.

## 4. Favicon verification (likely no change)

`public/favicon.png` (95.8 KB) was regenerated last turn as a purple→pink gradient rounded square with a white brain. Will:

- Open the generated PNG and visually confirm it matches `HeaderLogo.tsx` (purple→pink gradient, rounded square, white Lucide `Brain`).
- If it matches: no edit. Report "locked" status.
- If it does not match: regenerate **once** with a tighter prompt, then lock.

After this step, treat `public/favicon.png`, `public/favicon-32x32.png`, `public/favicon-16x16.png`, `public/logo.png` as locked — won't be modified in future turns unless you explicitly ask.

## 5. Meta-description fixes (code, 3 files)

| File | Change |
|---|---|
| `src/pages/Quizzes.tsx` line 258 | Replace `description=` value with: `"Free MCQ quizzes with answers for NTS, FPSC, PPSC, MDCAT, ECAT, Matric & FSc. 10,000+ questions with instant feedback. No signup needed — MCQsAI Pakistan."` |
| `src/pages/exams/ExamLandingPage.tsx` line 42 | Change `description={exam.metaDescription}` to dynamic template: `` description={`Free ${exam.name} preparation MCQs with answers. Practice ${exam.name} test online — ${exam.subjects?.slice(0,3).join(', ')}. No signup needed — MCQsAI Pakistan.`} `` |
| `index.html` line 15 | Already matches the requested string — verify only, no edit needed. |

No other files touched.

---

## Execution order after approval

1. Fetch `view-source:` of live site → write SSR audit report (chat only).
2. Apply meta-description edits (item 5) — 2 file edits.
3. Verify favicon visually (item 4) — likely no edit.
4. Build `/pakistan-exam-hub` page + route + sitemap entry + Index link (item 2).
5. Post item 3 as a follow-up planning note in chat (no code).
