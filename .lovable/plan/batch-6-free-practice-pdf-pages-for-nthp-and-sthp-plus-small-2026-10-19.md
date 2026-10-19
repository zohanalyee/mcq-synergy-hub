# Batch 6: Free practice PDF pages for NTHP and STHP, plus small fixes

No code has been changed yet. This plan replaces the growth audit report (that report was never shown; I can show it again on request).

## (a) What the audit found

**Part A: landing pages**
- No `/pdf/*` routes or `public/downloads/` folder exist today.
- The STHP mock test page is `/mock-tests/sukkur-iba-sindh-talent-hunt-program-sthp-2027`. The NTHP mock test page is the one you gave me.
- The STHP guide title contains "Past Papers". It will stay unchanged (`src/pages/exams/SthpGuide.tsx`).
- Canonical tags already drop the query string on every page (`GlobalCanonical.tsx`). Hub URLs with `?utm_source=pdf` already point to the clean apex URL. Nothing needs changing for that.
- `robots.txt` does not block `/downloads/`. That is correct: Google must be able to fetch the files to see the noindex header.

**Part C: Batch 6 items**
- **Share links:** the result share (`src/lib/growthRules.js` `whatsappResultUrl`) already links to the test's own page, never the homepage. It adds only `?utm_source=whatsapp`. The change is to add `&utm_medium=result_share`. Session pages still never get a share link.
- **"Job Test:" label:** it is added to every mock test's session name (`src/components/mock-tests/JobTestsTab.tsx` lines 224/241/318). That name is also used as a hidden key for saving progress (`TestSession.tsx` 363/461, `jobTestService.ts` 417, `useTestGrowth.ts`). So the fix should change only the **shown** text: drop the prefix when the test is not a job test (for example NTHP, STHP and university admission tests). The saved key stays the same, so nobody loses progress.
- **Analytics:** `src/utils/analytics.ts` sends the full path, so every `/test-session/<id>` becomes a new page in GA4. Nothing stops GA4 or Clarity from loading on `/admin` today. Both are in `index.html`, in the idle loader.

## (b) Files and routes

New files:
- `src/data/practicePdfs.ts`: one entry per exam. Each entry holds the slug, title, meta, H1, intro, set table, 5 preview questions, FAQs, official links, mock test link, hub link, PDF file name, and `verifiedOn` (empty means hidden; you set the date).
- `src/pages/pdf/PracticePdfLanding.tsx`: one shared page design for every exam.
- `src/components/PracticePdfBox.tsx`: a "Free practice PDF" box for hub and mock test pages.
- `src/lib/practicePdf.test.mjs`: checks the rules (see the Technical section).
- `public/downloads/NTHP-Free-Practice-Set-50-Questions-MCQsAI-v3.pdf` and `public/downloads/STHP-Free-Practice-Set-50-Questions-MCQsAI-v3.pdf`: your attached files, copied in unchanged.
- Public URLs: `https://mcqsai.com/downloads/NTHP-Free-Practice-Set-50-Questions-MCQsAI-v3.pdf` and `https://mcqsai.com/downloads/STHP-Free-Practice-Set-50-Questions-MCQsAI-v3.pdf`.

New routes: `/pdf/nthp-practice-questions` and `/pdf/sthp-practice-questions`.

Files to edit:
- `src/App.tsx`, `src/routes/lazyPages.ts`, `src/routes/eagerPages.tsx`, `src/routes/pageMap.ts`: register the page.
- `scripts/prerender-routes.mjs`: add the 2 routes.
- `scripts/inject-meta.mjs`: static title, meta, robots and canonical for the 2 routes.
- `scripts/generate-sitemaps.mjs`: add the 2 URLs to `exams.xml`.
- `src/pages/exams/NthpGuide.tsx` and `SthpGuide.tsx`: add the PDF box. On STHP only, also add the official sample papers block and 2 FAQs.
- `src/pages/MockTestDetail.tsx`: show the PDF box only on the NTHP and STHP mock tests.
- `src/pages/exams/ExamsHub.tsx` and `src/pages/MockTests.tsx`: add a small "Free practice PDFs" link row.
- `src/lib/growthRules.js` and its test: add `utm_medium` to the result share link.
- `src/lib/growthEvents.ts`: add the `pdf_download`, `pdf_share` and `channel_join_click` events.
- `src/components/mock-tests/JobTestsTab.tsx`, or the session header: change only the shown label.
- `src/utils/analytics.ts`: turn `/test-session/<id>` into `/test-session/:id`, and skip `/admin`.
- `index.html`: the idle loader skips GA4 and Clarity when the path starts with `/admin`. The delays stay the same.
- `scripts/startup-loaders.test.mjs`: add an admin-skip check.

## Page wording (proposed)

**NTHP page**
- Title (59 characters): NTHP Practice Questions PDF – Free Unofficial MCQs | MCQsAI
- Meta (about 150 characters): Free NTHP practice questions PDF: 50 original MCQs (Maths, English) based on the published syllabus, with answer key and explanations. Unofficial.
- H1: NTHP Practice Questions PDF (Free, Unofficial)

**STHP page**
- Title (57 characters): STHP Test Preparation PDF – Free Sample Questions | MCQsAI
- Meta (about 152 characters): Free STHP test preparation PDF: 50 original sample questions MCQs PDF (English, Maths, ICT) from the published syllabus. Answer key + explanations. Unofficial.
- H1: STHP Test Preparation PDF – Free Sample Questions (Unofficial)

**Both pages**
- Each page has these sections, in this order:
  - an intro of more than 120 words, with your honest label
  - the set table (NTHP: Maths 26, English 24; STHP: English 20, Maths 20, ICT 10; answer key and explanations; about 60 minutes)
  - your 5 preview questions with answers and explanations
  - the 4 buttons
  - 6 FAQs
  - official links
  - "Verified on", shown only when you have set the date
  - the disclaimer
- All content is in the static HTML.
- Schema: BreadcrumbList (Home > Exams > NTHP/STHP > Practice Questions PDF) and FAQPage only.
- The NTHP page never shows the word "STS". The disclaimer you asked for names STS, so it will be shortened on the NTHP page: "MCQsAI is an independent practice platform, not affiliated with IBA Karachi, Sukkur IBA University, OGDC, Mari Energies, Ihsan Trust or Meezan Bank." This follows your earlier rule. Please confirm.

**Buttons**
1. Download: a plain `<a href download>` link that works without JavaScript and sends `pdf_download {exam, placement}`.
2. Online test: links to the mock test.
3. Join channel: uses `whatsapp_channel_url`; if that is empty, it uses your fallback URL and sends `channel_join_click {placement}`.
4. Share on WhatsApp: shares the landing page with `?utm_source=whatsapp&utm_medium=pdf_share` and sends `pdf_share {exam, placement}`. It never shares the PDF file.

## (c) Sitemap change

- `exams.xml`: +2 URLs, `/pdf/nthp-practice-questions` and `/pdf/sthp-practice-questions`.
- All other sitemap files stay the same, except for changes caused by new data (which I will report separately).
- PDF files: 0 sitemap entries.
- The 2 new URLs get no lastmod, because no page-specific date exists. Existing lastmod values stay untouched.
- Expected result: total pages built goes up by exactly 2.

## (d) Internal links into the new pages (static `<a href>`)

- `/exams/nthp` → NTHP PDF page.
- `/exams/sthp` → STHP PDF page.
- The NTHP mock test → NTHP PDF page.
- The STHP mock test → STHP PDF page.
- `/exams` → both PDF pages.
- `/mock-tests` → both PDF pages.
- From the PDF pages: links back to their hub, their mock test, and `/exams`. The NTHP page has no STS link.

## (e) Risks and what I recommend not doing

- Low risk: new pages only. Hub titles, meta and H1s stay the same.
- **Mock test page links are client-side today.** If a mock test's static HTML comes from `inject-meta`, I will add the link there as well. Otherwise it is only visible after the page loads in the browser. I will report which.
- **Do not** rename the hidden "Job Test:" session key. That would break saved progress and resume.
- **Do not** put the PDFs in storage, in a sitemap, or behind `robots.txt` blocking.
- `channel_join_click` duplicates the existing `whatsapp_join_click`. I suggest sending `channel_join_click` only on the new PDF buttons. The existing event stays on the current buttons, so earlier reports remain comparable.
- If you change the WhatsApp channel later, the fallback URL in the code goes stale. Setting the admin value avoids this.

## (f) Your checklist after publishing

1. In the Cloudflare dashboard, go to Rules → Transform Rules → Modify Response Header → Create rule.
   - Name: Noindex downloads.
   - Custom filter: Field URI Path, operator "starts with", value `/downloads/`.
   - Choose Set static, header `X-Robots-Tag`, value `noindex`.
   - Click Deploy.
2. Go to Caching → Purge Cache, and purge these URLs: the 2 PDF pages, `/exams/nthp`, `/exams/sthp`, `/sitemap.xml`, `/sitemaps/exams.xml`, and the 2 PDF files.
3. Check the header with `curl -I https://mcqsai.com/downloads/NTHP-Free-Practice-Set-50-Questions-MCQsAI-v3.pdf`. You should see `x-robots-tag: noindex`.
4. In Search Console, use URL Inspection → Request indexing for the 2 pages, then resubmit `sitemap.xml`.
5. In GA4, go to Admin → Events. After the events show up (usually within 24 hours), turn on "Mark as key event" for `pdf_download`, `channel_join_click` and `pdf_share`. Custom events can be marked as key events. Register `exam` and `placement` as custom dimensions.
6. Recheck in 30 days: are the PDFs not indexed and the pages indexed?

## Technical section

Tests (`node --test`):
- titles are 60 characters or less
- meta descriptions are 155 characters or less
- the NTHP page data has no "STS"
- the share URL has the right UTM tags and the apex domain
- the session path is normalised
- admin paths skip analytics
- the quality gate passes (60 or more words, 3 or more FAQs)

After the build:
- check the raw HTML of both pages (title, meta, H1, canonical, robots, JSON-LD types)
- check the `exams.xml` diff
- check that the two files under `/downloads/` load

## Open questions

1. Should the NTHP page use the disclaimer without STS? (My recommendation is yes.)
2. What date should go in "Verified on"?
