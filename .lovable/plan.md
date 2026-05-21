# SEO + Favicon Plan

Mix of audit (read-only) + fixes. Below = findings first, then proposed changes grouped so you can approve/reject.

---

## A. Findings (audit-only, no changes proposed)

### A1. Favicon files in `public/`
- `favicon.ico` ✅ exists (1.1 KB — old heart)
- `favicon.png` ✅ exists (152 KB — old heart)
- `favicon-16x16.png` ❌ missing
- `favicon-32x32.png` ❌ missing
- `logo.png` ❌ missing (referenced by `index.html` `msapplication-TileImage` and `browserconfig.xml` → currently 404)

The "brain logo" in the navbar is **not an image file** — it's the Lucide `<Brain />` SVG icon inside a purple-gradient rounded square in `src/components/header/HeaderLogo.tsx`. There is no PNG/SVG asset to copy. A new favicon PNG must be generated to match that visual.

### A2. `public/sitemaps/exams.xml`
Already updated — contains **26 URLs**: `/exams`, fpsc, nts, css, pms, ppsc, spsc, kppsc, bpsc, ajkpsc, mdcat, mdcat-sindh, nums, amc, ecat, nts-nat, nts-gat, matric, fsc-pre-medical, fsc-pre-engineering, sst, pst, educators, lecturer, fia, police. ✅ Includes all the ones you listed (spsc, kppsc, matric, fsc-pre-medical, etc.). No fix needed.

### A3. Meta description (your point #7)
**It was updated.** Current `index.html` line 14:
```
content="Free AI MCQ practice for NTS, FPSC, PPSC, MDCAT, ECAT, Matric & FSc. 100,000+ questions with instant feedback. No signup needed — MCQsAI Pakistan."
```
Difference vs your latest message: previously agreed text says **"100,000+"**, your new message says **"10,000+"**. Need you to confirm which number is correct before I touch it again. (Browser may also be showing a cached old description — hard refresh / new deploy needed.)

### A4. GA4 tracking
✅ Installed in `index.html`. Measurement ID: **`G-92HVL8ZQFC`**.

### A5. Title patterns (dynamic pages)
| Page | Current title pattern | Verdict |
|---|---|---|
| `BoardLandingPage` | `${boardName} – Classes & Subjects \| MCQsAI` | OK, could add "MCQs Pakistan" |
| `BoardTopicPage` | Custom `seoTitle` w/ topic+subject+class+board ✅ | Good |
| `SubjectContent` | `${title} MCQs - Practice Questions \| MCQsAI` | OK but no board/class |
| `BlogPost` | `meta_title \|\| post.title` | Depends on data |
| `JobDetailPage` | `${title} - Job Opportunity \| MCQsAI` | Weak — no location/year |
| `ScholarshipDetailPage` | `${title} - Scholarship \| MCQsAI` | Weak — no year/country |
| `Tools` | `Free AI Tools & Calculators for Students \| MCQsAI` | OK (index only — **individual tool pages have no `<SEOHead>` at all**) |
| `Quizzes` | `Online Quiz Practice Tests \| MCQsAI` | Weak — no "Pakistan/MCQs" |
| `MockTests` | `Competitive Exam Practice Tests \| MCQs AI` | OK |

**Biggest gap: 80+ individual `/tools/*` pages have no SEO head at all.**

### A6. GSC-based CTR title recommendations
I do **not** have GSC API access from this session — only Semrush. Real GSC CTR data would need the GSC connector or you exporting Queries CSV. What I *can* do: pull Semrush ranking data for your pages and recommend titles based on intent + Pakistani search modifiers ("2026", "free", "pdf", "with answers", "in Urdu").

### A7. Competitor `top_pages` (your point #6)
Need to run Semrush `top_pages` + `page_analysis` against `mcqshome.com`, `solvedmcqs.com`, `testpreparation.ca` in the **PK** database. This is a separate read-only step — propose to run it as part of execution.

---

## B. Proposed changes (require approval)

### Fix 1 — Brain favicon
1. Generate a new favicon image matching navbar: white Lucide-style brain icon on purple→pink gradient rounded square, on solid white background, at 512×512.
   - Save to `public/favicon.png` (overwrite old heart), `src/assets/logo.png` (for app reuse).
2. Generate 32×32 and 16×16 variants → `public/favicon-32x32.png`, `public/favicon-16x16.png`.
3. Copy the 512px PNG to `public/logo.png` (fixes the current 404 referenced by `msapplication-TileImage` and `browserconfig.xml`).
4. Delete stale `public/favicon.ico` (it's the old heart and overrides PNGs in some browsers).
5. Update `index.html` favicon block to exactly:
   ```html
   <link rel="icon" type="image/png" href="/favicon.png">
   <link rel="shortcut icon" type="image/png" href="/favicon.png">
   <link rel="apple-touch-icon" href="/favicon.png">
   <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
   <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
   <meta name="msapplication-TileImage" content="/favicon.png">
   ```
6. Update `public/browserconfig.xml` → `<square150x150logo src="/favicon.png"/>`.

### Fix 2 — Meta description number
Confirm the correct figure: **"100,000+"** (current) or **"10,000+"** (your new message). I will not change unless you tell me which.

### Fix 3 — Title improvements (optional, batch)
Only if you approve, I'll tighten these for PK CTR:
- `Quizzes`: → `Free MCQ Quizzes with Answers 2026 | NTS, FPSC, MDCAT — MCQsAI Pakistan`
- `BoardLandingPage`: → `${boardName} MCQs 2026 — All Classes & Subjects | MCQsAI Pakistan`
- `SubjectContent`: → `${title} MCQs with Answers — Free Practice | MCQsAI Pakistan`
- `JobDetailPage`: → `${title} 2026 — Apply Online, Test Preparation | MCQsAI`
- `ScholarshipDetailPage`: → `${title} 2026 — Eligibility, Last Date, Apply | MCQsAI`
- Add a generic `<SEOHead>` wrapper to **all `/tools/*` pages** that derives `title` + `description` from the tool name (single shared component change, no per-file edits beyond import).

### Step 4 — Competitor research (read-only Semrush calls)
Run, in PK database:
- `top_pages` × 3 (mcqshome / solvedmcqs / testpreparation)
- `page_analysis` on the top 2 URLs from each
- Compile a low-KD (<30) keyword shortlist with PK volume.

Output: a single ranked table. No code changes from this step.

---

## Questions before executing
1. Description number: **100,000+** or **10,000+**?
2. Approve Fix 1 (favicon regeneration with auto-generated brain image)?
3. Approve Fix 3 (title rewrites + tools SEOHead wrapper)?
4. Approve Step 4 (Semrush competitor pulls — consumes a few API calls)?
