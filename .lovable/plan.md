# Batch 8, Phase 1 — Admin "PDF Builder" (plan only)

## What the owner gets
A new **Admin → PDF Builder** screen (works on a phone). Pick a test, pick how many questions and the section split, check the list, tap **Generate PDF**, and the branded file downloads. It looks like the two v3 reference PDFs: same A4 layout, header, gradient line, watermark, cover table, questions, answer key and "Next step" box.

## What I found in the reference PDFs
- Both are 10 A4 pages, made with ReportLab, using **DejaVu Sans** and **DejaVu Sans Bold** (embedded), plus the logo image (512×512) used twice per page (header + faint background) and a QR image on the cover/last page.
- Every page: "MCQSAI" header + "mcqsai.com", gradient rule, diagonal "mcqsai.com" watermark, footer line "MCQsAI · {set name} · Independent practice set, not an official paper · mcqsai.com" and "Page N".
- Cover: title, subtitle line, "Please read first" box (3 bullets), section/questions table with Total, disclaimer, "Found a mistake?" line.
- **Issue to flag:** the NTHP v3 reference cover disclaimer says "...not affiliated with IBA Karachi, Sukkur IBA University **or STS**". Your rule says no STS on NTHP sets. The builder will use the NTHP disclaimer already approved for the website (no STS). So the generated NTHP set will differ from the reference in that one line — on purpose.

## Answers to your 5 questions

**1. Library: pdf-lib (+ its font helper "fontkit") and qrcode.** pdf-lib, jsPDF and qrcode are already in the project, so nothing new is bought or loaded from a CDN.
- Gradient line: drawn as many thin coloured strips from purple to magenta to cyan. It looks smooth when printed, the same way ReportLab draws it.
- Transparent watermark and faint logo: pdf-lib supports opacity (about 7%) and rotated text.
- Unicode font: DejaVu Sans and DejaVu Sans Bold files go into the project. Only the letters a set actually uses are embedded, so files stay small (about 100–200 KB, like the reference).
- QR: qrcode makes a PNG that is placed in the PDF.
- No split questions: each question's height is measured before drawing. If it doesn't fit, it moves to the next page.
- Why not jsPDF: its font and transparency support is weaker, and it embeds whole fonts (bigger files). Why not @react-pdf/renderer: it's a new, heavy library and gives less control over the exact layout.
- Loaded only when the PDF Builder opens: about 1.5–2 MB in total (pdf-lib about 0.5 MB, fontkit about 0.7 MB, the two fonts about 1.4 MB, qrcode about 0.05 MB), before compression. **Public pages (homepage, /exams, hubs, mock tests) load nothing new.** I'll confirm this by comparing the public build files before and after.

**2. Question bank audit**
- Questions are in `job_test_questions`: `question`, `options` (list of 4), `correct_answer`, `explanation`, `subject` (used as the section), `topic`, `admin_approved`. They link to the test through `job_test_id` → `job_test_definitions`.
- Section ratio: taken from the definition's `syllabus`. If the syllabus has no ratio, the split follows how many questions each subject has.
- Quality Gate results are in `question_quality_reviews` (the latest row per question). "Passed" = deterministic check OK **and** AI verdict "pass". Today there are only 30 reviews: 18 pass and 12 "needs_review", all for NTHP.
- Filter: show questions that **passed** or are **admin-approved**, but never one whose latest review is "needs_review" or failed. Each section shows its eligible count. If a section is short, the builder says so and doesn't fill the gap.
- Top 10 tests today (approved questions / with explanation / Gate-passed):

| Test | Approved | With explanation | Passed |
|---|---|---|---|
| IBA Karachi NTHP Mock Test 2027 | 201 | 201 | 18 |
| AJK MDCAT 2025 | 740 | 740 | 0 |
| Federal/Islamabad MDCAT 2025 | 540 | 540 | 0 |
| Balochistan MDCAT 2025 | 540 | 540 | 0 |
| Punjab MDCAT 2025 | 540 | 540 | 0 |
| KPK MDCAT 2025 | 540 | 540 | 0 |
| Sindh MDCAT 2025 | 540 | 540 | 0 |
| Junior Office Associate (BPS-13) | 500 | 500 | 0 |
| Junior Clerk BPS 11 | 319 | 319 | 0 |
| Stenotypist (BPS-14) | 310 | 310 | 0 |

- Note: several MDCAT test names start with "Official ...". The PDF title will be typed by the admin, and the builder will **block "official" and "past paper"** in the title and set name.

**3. Logo:** the file is `src/assets/logo.png` (the same one used in the site header). The builder loads it as a normal image and embeds it twice per page: once in the header and once as a faint background. The site logo itself is not changed.

**4. Side-by-side check:** after the build, I'll generate a 50-question NTHP set (26 Maths / 24 English, explanations on) in the preview. I'll turn each page into an image and compare it with the v3 reference, then fix anything that differs. You get the file to send for review. Phase 1 counts as done only after you confirm it matches.

**5. Risks / what can't match exactly**
- The NTHP disclaimer line will have no STS mention (see above).
- Line breaks and page count can differ slightly, because the questions are different from the reference.
- The gradient is drawn as strips. It looks the same on screen and in print, but a very close zoom may show tiny bands.
- iPhone: the file may open in the share sheet. Use "Save to Files".
- Only 18 Gate-passed questions exist today, so most sets will rely on admin-approved questions until the Gate has checked more.

## Rules kept
Questions are only read, never edited or deleted. Answer options are shuffled with a saved seed, then rebalanced so A–D appear evenly. "Rebuild" recreates the same set exactly. There are no AI calls, no server step and no paid services. Titles, meta, sitemaps, the Quality Gate and AI budget code stay unchanged. NTHP/STHP/STS names are never mixed.

## Technical section
- **Migration:** new table `pdf_practice_sets` (`id`, `definition_id`, `title`, `set_number`, `hub_slug`, `question_count`, `section_split` jsonb, `seed` bigint, `question_ids` uuid[], `options_order` jsonb, `require_explanation` bool, `file_name`, `created_by`, `created_at`, `updated_at`). Access is granted to the logged-in role and the service role, RLS is on, and one policy allows everything only for `is_admin()`. It also gets the `updated_at` trigger.
- **New files:**
  - `src/lib/pdfBuilder/selection.ts`: picks eligible questions, splits sections and handles swap/remove.
  - `src/lib/pdfBuilder/shuffle.ts`: seeded shuffle (mulberry32) and letter balancing.
  - `src/lib/pdfBuilder/wording.ts`: banned words, plus a disclaimer per exam (reused from `practicePdfs.js`).
  - `src/lib/pdfBuilder/render.ts`: pdf-lib layout (header, rule, watermark, cover, questions, key, next step, footer).
  - `src/pages/admin/PdfBuilder.tsx`: the screen, lazy-loaded.
  - `src/assets/fonts/DejaVuSans*.ttf`.
- **Edited files:** the admin route/menu entry (one link) and `src/routes/lazyPages.ts`. If `@pdf-lib/fontkit` is missing, it gets added (the only new package).
- **Links:**
  - Hub: `https://mcqsai.com/exams/{slug}?utm_source=pdf&utm_medium=free_pdf&utm_campaign={slug}_{N}q`.
  - WhatsApp channel: `whatsapp_channel_url` setting, with fallback `CHANNEL_FALLBACK`.
  - Share: wa.me text pointing to the hub with `utm_source=whatsapp&utm_medium=pdf_share`.
- **Tests:**
  - The same seed gives the same order.
  - Answer letters stay balanced within ±1.
  - A short section is reported and never filled.
  - "needs_review" questions are excluded.
  - The banned-word check works.
  - The NTHP disclaimer has no "STS".
  - The file name format is correct.
- **Bundle check:** compare the public route files before and after, and confirm pdf-lib, fontkit and fonts appear only in the PDF Builder file.

## Mobile owner checklist
1. Admin → PDF Builder.
2. Pick a test, then check the section counts.
3. Set the count, split, title, set number and hub slug.
4. Review the list, then remove or swap questions.
5. Generate PDF, then save it.
6. Old sets are listed below with a "Rebuild".
