# GSC Performance audit + mock-test landing pages (6 Oct 2026, audit only)

Source: Search Console, property `sc-domain:mcqsai.com`, 7 Sep – 4 Oct 2026 (last 28 complete days). No changes made.

## 0. The headline finding: there is almost no data to tier

The last 28 days total only **155 impressions and 32 clicks across 45 pages**. 31 of those clicks are the homepage, from people searching the brand name ("mcqs ai", "mcq ai").

This is a collapse, not a ranking problem:

| Period | Clicks | Impressions |
|---|---|---|
| 1–15 Jul | 28 | 413 |
| 16–31 Jul | 175 | 2,141 |
| 1–15 Aug | 701 | 7,168 |
| 16–31 Aug | 578 | 4,399 |
| 1–15 Sep | 17 | 61 |
| 16–30 Sep | 20 | 69 |
| 1–3 Oct | 3 | 9 |

Visibility fell about 98% at the start of September. The fall lines up with the time Google was getting "access forbidden (403)" errors from the old Cloudflare challenge rule, and with the MDCAT exam season ending. Pages that were dropped while blocked haven't come back yet. A position 8–30 list can't fix this. Getting pages re-crawled and back into Google's index has to come first.

## 1. Every page ranking at position 8–30 (by impressions)

| Page | Impr | Clicks | Avg pos |
|---|---|---|---|
| /exams/mdcat | 5 | 0 | 15.8 |
| /p/mdcat-karachi | 3 | 0 | 10.7 |
| /boards/punjab.../class-7/mathematics/fundamentals-of-geometry | 2 | 0 | 8.5 |
| /boards/sindh.../class-10/mathematics/sets-and-functions | 2 | 0 | 22.5 |
| /mdcat-syllabus | 1 | 0 | 9 |
| /blog/meezan-bank-personal-banking-officer-jobs-2026 | 1 | 0 | 10 |
| /editorial-policy | 1 | 0 | 10 |
| www.mcqsai.com/boards/aga-khan-...-aku-eb | 1 | 0 | 10 |
| /forces-jobs-tests | 1 | 0 | 20 |

Search terms behind these: "mdcat mcqs test" (pos 17.5), "mdcat test mcqs" (14), "mcqs mdcat entry test preparation" (15), "mdcat test practice" (15), "government job test" (20).

## 2. Tiers

- **Tier A (pos 1–10, protect):** homepage (95 impr, pos 1.3), /mock-tests, /exams, /exams/css, /exams/ppsc, /mdcat-past-papers, /quizzes, /subjects, /sindh-universities-entry-test, /tenders, 3 mock tests (Security Officer Sindh High Court, Punjab MDCAT, Sindh EST), a few board topics. Each has 1–3 impressions.
- **Tier B (pos 11–20, opportunity):** only 3 pages: /exams/mdcat, /p/mdcat-karachi (10.7, on the edge) and /forces-jobs-tests.
- **Tier C (pos 21–50):** /exams/ecat (43, "ecat test preparation mcqs" at 78), ~12 board topic pages (pos 22–47), the Jamshoro Junior Clerk mock test (35), two opportunity pages (39–41), four old /subject-content/<id> addresses (31–33), and two www /subject?topic= test-start links (45–46).
- **Tier D (no impressions):** nearly all of the ~1,480 sitemap pages, including 86 of the 90 mock tests and all 21 exam guides except mdcat/ecat/css/ppsc. With this little data, that reflects the drop in what Google has indexed. It doesn't prove these pages are weak, so I'm not recommending a hard stop on any page type yet.

## 3. Priority list (only 3 real Tier B pages, plus the gaps the data shows)

1. **/exams/mdcat (pos 15.8):** people search "mdcat mcqs test" and "mdcat test practice". Add "MCQs Test & Practice" to the title and first heading. Add a section linking straight to the MDCAT mock tests and subject MCQs. Also, the exam is over now, so swap the countdown for "MDCAT 2027" planning content.
2. **/p/mdcat-karachi (10.7):** link to it from /exams/mdcat and /mdcat-past-papers. Make sure its title says "Karachi MDCAT MCQs".
3. **/forces-jobs-tests (20, "government job test"):** add a "government job tests" section that links to the mock tests for FPSC, PPSC, SPSC and the court jobs.
4. **Recovery (more important than 1–3):** use Search Console's URL Inspection → Request Indexing on the top ~20 pages that earned the August traffic. Then check the Page indexing report to confirm the 403 count is going down.
5. **Clean-up:** old /subject-content/<id> and www /subject?topic=... links still show in results. Check that they send visitors to the proper page address, so ranking signals aren't split.

Before working down a full top-10, we should re-run this audit in 2–3 weeks once pages are re-indexed. The August data (when the site was healthy) is the better guide, and I can pull an Aug 1–31 page/query list if you want to plan from that instead.

## 4. Mock tests as dedicated SEO landing pages: current state

They already are individual pages Google can index:
- All 90 published mock tests have their own address (/mock-tests/<slug>), are in mock-tests.xml (90 entries), and are index,follow.
- At build time, each page gets its real content written into the HTML: intro, test pattern, official syllabus with weightage, past-paper pattern, a question preview without answers, related tests and FAQ. Crawlers that don't run JavaScript can read it too.
- What's missing is the **subject level**. There's no "MDCAT Biology Mock Test" page. Exam → mock test links exist, but mock test → subject mock → topic MCQs doesn't. Subjects only show up inside a test.

### What building the hierarchy would take

```text
/exams/mdcat -> /mock-tests/mdcat (exam hub) -> /mock-tests/mdcat/biology (subject mock) -> /boards/.../biology/<topic> (topic MCQs)
```

- New subject-mock page type built from existing syllabus weightage plus the approved question bank. It needs its own quality bar (for example, at least 50 approved questions, at least 60 words of intro, at least 3 FAQs) so thin subjects stay noindex and out of the sitemap. Same rule-driven approach as /p/ and /exams.
- Links between levels with breadcrumbs, plus build-time content like the existing mock-test pages.
- A new sitemap section driven by that quality bar.
- Rough size: MDCAT, ECAT, NTS-GAT, FPSC/PPSC/SPSC general and EST/SST give about 40–70 subject pages that would pass the bar.
- Effort: about 2–3 build turns.
- Timing: I'd start this after the recovery in step 4. New pages won't get traffic while Google is still re-indexing the existing ones.

## Decisions for you

- Plan from August's healthy-period data instead (I can pull it), or act on the 3 Tier B items now?
- Go ahead with the subject-mock hierarchy now, or after re-indexing recovers?
