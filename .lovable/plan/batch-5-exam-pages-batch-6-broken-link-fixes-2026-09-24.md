# Batch 5 exam pages + Batch 6 broken-link fixes

## Section 2 first — broken internal links (findings)

All six are still broken today. Unknown exam addresses fall through to the "not found" screen, and none of these six names exists in the exam list (only mdcat, ecat, css, ppsc, fpsc, nts, pms are data-driven, plus the standalone nums, iba-sukkur, lat, karachi-university, sindh-university, nat pages).


| Broken link                | Linked from                                                                       | Proposed fix                                                                                                                                                                                                                             |
| -------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| /exams/nts-nat             | Punjab University Entry Test, ECAT Preparation                                    | point to /exams/nat (built last batch)                                                                                                                                                                                                   |
| /exams/fsc-pre-engineering | 9th Class MCQs, Engineering Universities Entry Test, ECAT Preparation, Board MCQs | point to /ecat-preparation                                                                                                                                                                                                               |
| /exams/fsc-pre-medical     | MDCAT Syllabus (2 places), 9th Class MCQs, Board MCQs                             | point to /exams/mdcat                                                                                                                                                                                                                    |
| /exams/matric              | 9th Class MCQs                                                                    | point to /9th-class-mcqs sibling content → /board-mcqs                                                                                                                                                                                   |
| /exams/educators           | PST/SST Test Preparation                                                          | point to /pst-sst-test-preparation                                                                                                                                                                                                       |
| /exams/spsc                | Sindh Universities Entry Test, PPSC Past Papers                                   | no SPSC page exists. Recommendation: relabel to "Commission Mock Tests" pointing at /mock-tests rather than sending Sindh candidates to the Punjab PPSC page. (Say the word if you'd rather have a real /exams/spsc page built instead.) |


Only the link `url`/`label` values in those seven files change — no layout, no routes, no content rewrites.

## Section 1 — Batch 5 exam pages

Eight new pages on the existing shared admission-test template, each with exam body, duration, marks, frequency, subjects, eligibility, prep tips, official source plus "verified on 23 September 2026", and related-exam cross-links. Anything the official site does not state is written as "not yet announced".

- /exams/lums — lums.edu.pk admissions (LCAT / SAT route, SSE requirements)
- /exams/aku — aku.edu admissions
- /exams/giki — giki.edu.pk admissions
- /exams/uet-lahore — see note below
- /exams/air-university — au.edu.pk admissions
- /exams/pieas — pieas.edu.pk admissions
- /exams/hec-gat-subject — HEC / ETC official GAT-Subject page
- /exams/usat — HEC Education Testing Council (etc.hec.gov.pk)

### Two pre-checks you asked for

- **USAT is live and currently administered.** It is run by HEC's Education Testing Council, held quarterly, six streams (Arts, Commerce, Computer Science, Pre-Engineering, General Science, Pre-Medical), score valid one year, current cycle registration Sep–Oct 2026 with a 25 October 2026 test date. The page will be sourced from etc.hec.gov.pk / hec.gov.pk only; the dated cycle details go in a "current cycle" line that is easy to refresh.
- **UET Lahore does use ECAT** — ECAT is conducted by UET Lahore itself and is compulsory for engineering, computing and architecture programmes, while some business/science programmes are explicitly non-ECAT. So /exams/uet-lahore will **not** repeat the ECAT paper pattern; it covers the UET admission route (who needs ECAT, who doesn't, minimum intermediate marks, merit weightage, application window) and links to /exams/ecat for the paper itself. If you'd rather it be a full standalone ECAT-pattern page, tell me and I'll duplicate the pattern there instead.

Facts will be verified page by page against the official sites before each page is written; any site that can't be read, or a detail it doesn't state, results in "not yet announced" rather than a guess.

## Rules kept

- No ads on any of the eight pages.
- No sitemap entries (the sitemap generator's exam list stays untouched).
- Existing pages and routes untouched apart from the seven link-value edits in Section 2.

## Technical notes

- New files under `src/pages/exams/`, each reusing `AdmissionTestPage.tsx` as a data-only page.
- Additive registrations only: `pageMap.ts` PageKey entries, `lazyPages.ts`, `eagerPages.tsx`, eight explicit `<Route>` lines in `App.tsx` placed above the `/exams/:examSlug` catch-all, and `PRERENDER_ROUTES` in `vite.config.ts`.
- `examData.ts` and `scripts/generate-sitemaps.mjs` stay unchanged.
- Section 2 touches only the related-link arrays in `PunjabUniversityEntryTest.tsx`, `ECATPreparation.tsx`, `NinthClassMCQs.tsx`, `BoardMCQs.tsx`, `EngineeringUniversitiesEntryTest.tsx`, `MDCATSyllabus.tsx`, `PSTSSTTestPreparation.tsx`, `SindhUniversitiesEntryTest.tsx`, `PPSCPastPapers.tsx`.

&nbsp;

Plan approved for both sections:

Section 2 — proceed with all 6 link fixes as proposed, including relabeling the SPSC link to "Commission Mock Tests" pointing at /mock-tests (no need to build a real /exams/spsc page without genuine SPSC-specific content).

Section 1 — proceed with all 8 pages. Confirmed: UET Lahore should be the admission-route page (who needs ECAT, merit weightage, application window) linking to /exams/ecat for the paper itself — not a duplicate ECAT-pattern page.

Verify after: confirm all 8 new pages render correctly, all 6 link fixes point to working destinations, and existing pages/routes remain untouched.