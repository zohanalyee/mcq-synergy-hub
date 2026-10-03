# SEO Remaining Work and Landing-Page Audit (3 Oct 2026, audit only)

## 1. All 20 /p/ landing pages

The quality check requires an intro of at least 60 words and at least 3 FAQs. All 20 pages pass it, all 20 are in the sitemap, and none of them redirect.


| Page                    | Intro words | FAQs | Status                     |
| ----------------------- | ----------- | ---- | -------------------------- |
| mdcat-karachi           | 67          | 4    | index                      |
| mdcat-sindh             | 62          | 3    | index (close to the limit) |
| mdcat-islamabad         | 94          | 4    | index                      |
| mdcat-lahore            | 65          | 4    | index                      |
| mdcat-punjab            | 64          | 3    | index (close to the limit) |
| nts-karachi             | 89          | 4    | index                      |
| nts-lahore              | 93          | 4    | index                      |
| nts-islamabad           | 93          | 4    | index                      |
| css-islamabad           | 117         | 4    | index (fixed yesterday)    |
| css-karachi             | 63          | 3    | index (close to the limit) |
| fpsc-islamabad          | 86          | 4    | index (fixed yesterday)    |
| fpsc-karachi            | 93          | 3    | index                      |
| ppsc-lahore             | 87          | 4    | index (fixed yesterday)    |
| ppsc-punjab             | 98          | 4    | index                      |
| ecat-punjab             | 92          | 4    | index                      |
| ecat-lahore             | 63          | 3    | index (close to the limit) |
| biology-mcqs-class-11   | 66          | 4    | index                      |
| biology-mcqs-class-12   | 64          | 3    | index (close to the limit) |
| chemistry-mcqs-class-12 | 61          | 4    | index (close to the limit) |
| physics-mcqs-class-12   | 93          | 4    | index                      |


- I checked 5 of these pages on the live site just now as Googlebot: mdcat-sindh, ecat-lahore, css-karachi, fpsc-karachi and biology-mcqs-class-11. All 5 returned page OK and index,follow.
- No page is thin. Seven pages are only 1 to 4 words, or 0 to 1 FAQ, above the limit: mdcat-sindh, mdcat-punjab, css-karachi, ecat-lahore, biology-12, chemistry-12 and mdcat-lahore. One small edit to any of them could quietly switch it to noindex. The fix is to add 30 to 50 words and one more FAQ to each, so they have the same safety margin as the three pages fixed yesterday.
- **Caution:** the live check only covered pages already published. The edits to fpsc-islamabad, css-islamabad and ppsc-lahore go live only after Publish.

## 2. Other page types with a thin-content or noindex check


| Page type                                       | How it decides                                              | Risk                           |
| ----------------------------------------------- | ----------------------------------------------------------- | ------------------------------ |
| Board, class and subject pages                  | noindex if thin, using the same source as the sitemap       | Checked in August. Low risk.   |
| Board topic pages                               | noindex below 5 approved MCQs                               | Checked. Ads hidden when thin. |
| Job and scholarship detail pages                | noindex if thin                                             | Not audited recently.          |
| Announcement detail pages                       | noindex unless marked indexable                             | Not audited.                   |
| Blog posts                                      | noindex under 80 words (0 of 33 are thin)                   | Fine.                          |
| Mock tests (90)                                 | indexed. Only tests with no syllabus (1 or 2) skip the body | Fine.                          |
| Exam pages (Batch 5, 8 pages, plus KU, SU, NAT) | kept out of the sitemap on purpose until complete           | Deferred decision.             |
| Tool pages                                      | 15 indexed, the rest noindex on purpose                     | Fine.                          |


## 3. Open SEO items still deferred

1. **Publish pending.** The latest mock-test titles, the IBA Community Colleges wording, the 15 tool titles, the 3 /p/ page fixes and the blog ad check are not live yet.
2. The Batch 5, KU, SU and NAT exam pages have not been added to the sitemap.
3. The job and scholarship detail pages and the announcement pages need the same audit as the /p/ pages. That means listing how many of each are noindex and checking whether any substantial pages are being held back.
4. Search Console: 303 pages are "Crawled – currently not indexed" and 11 are duplicate canonicals. Neither has been reviewed page by page.
5. 31 old questions with the [FORCE-SAVE] text, recorded in earlier audits, need their status re-checked.
6. The 13-question reasoning block repeated across 23 tests still needs the shared-pool change.

## Proposed next steps (after approval)

- A. Publish first.
- B. Add a safety margin to the 7 /p/ pages that are close to the limit.
- C. Run the same audit on job, scholarship and announcement detail pages, as a report only.
- D. Decide on adding the exam pages to the sitemap, after a fact check.

&nbsp;

Please proceed with Point B: add 30-50 words + 1 more FAQ each to mdcat-sindh, mdcat-punjab, css-karachi, ecat-lahore, biology-mcqs-class-12, chemistry-mcqs-class-12, and mdcat-lahore — same safety-margin approach as the 3 pages fixed yesterday. Verify facts, mark unconfirmed details "not yet announced".

&nbsp;

Please run Point C: audit job, scholarship, and announcement detail pages the same way as /p/ pages — report only, how many are noindex vs indexed, and whether any substantial/complete content is being wrongly held back.