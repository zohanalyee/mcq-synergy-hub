# Admission Tests: Inventory, New Hub Page, and Missing University Pages

## Part 1 — Confirmed inventory (verified in code + DB)

### Exam landing pages that actually exist (`/exams/:slug`, data in `src/data/examData.ts`)

Only 7 slugs exist. Anything else under `/exams/*` renders NotFound.


| URL          | Type                               |
| ------------ | ---------------------------------- |
| /exams/mdcat | Admission (medical)                |
| /exams/ecat  | Admission (engineering)            |
| /exams/nts   | Testing service (NAT/GAT umbrella) |
| /exams/css   | Competitive                        |
| /exams/ppsc  | Competitive                        |
| /exams/fpsc  | Competitive                        |
| /exams/pms   | Competitive                        |


### Standalone entry-test SEO pages (separate routes, not under /exams)

- /nust-entry-test
- /punjab-university-entry-test
- /comsats-entry-test
- /sindh-universities-entry-test (covers IBA Sukkur, MUET, LUMHS, Sindh Univ., Mehran, QUEST, SALU, SZABIST as a list — not individual pages)
- /engineering-universities-entry-test
- /ecat-preparation, /mdcat-past-papers, /mdcat-syllabus (support pages)

### Mock test coverage for admission tests (`job_tests` table)

- HEC Law Admission Test (LAT) — exists
- NTS GAT General Mock Test — exists
- Provincial MDCAT syllabus/pattern tests: Punjab (UHS), Sindh (STS), KPK (KMU), Balochistan (BUMS), AJK/Federal (SZABMU)
- No mock test rows for NUMS, LUMS, KU, Sindh University, IBA Sukkur, ECAT-specific, HEC GAT Subject

### Broken internal links found (pre-existing bugs worth fixing in this work)

These are linked from existing pages but have no route, so they 404:
`/exams` (also present in `public/sitemaps/exams.xml` — a 404 already submitted to GSC), `/exams/nts-nat`, `/exams/spsc`, `/exams/nums`, `/exams/educators`, `/exams/matric`, `/exams/fsc-pre-medical`, `/exams/fsc-pre-engineering`.

### Missing university admission tests (no dedicated page)


| Test                                                                                                                             | Status                                               | Distinct pattern?                                                 |
| -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| NUMS Entry Test                                                                                                                  | Missing (only mentioned via broken /exams/nums link) | Yes — NUMS runs its own test, different weightage from PMDC MDCAT |
| LUMS (SSE/LCAT + SAT route)                                                                                                      | Missing                                              | Yes — LUMS-specific admission assessment, math/analytical heavy   |
| Karachi University (KU)                                                                                                          | Missing                                              | Yes — faculty-wise admission test                                 |
| Sindh University (Jamshoro)                                                                                                      | Only a bullet on the Sindh combined page             | Yes — faculty-wise pre-admission test                             |
| IBA Sukkur / IBA Karachi                                                                                                         | Only a bullet on the Sindh combined page             | Yes — aptitude (English, Math, IQ) — reusable with NTS NAT bank   |
| Also missing: AKU (medical), Aga Khan/Dow (SMBBMU), GIKI, UET Lahore (ECAT-linked), Air University, PIEAS, HEC GAT Subject, USAT | Missing                                              | Mixed — GIKI/PIEAS/UET reuse ECAT bank; AKU/Dow reuse MDCAT bank  |


## Part 2 — New admission-tests hub page

- **URL: `/exams**` — fills the existing 404, is already in the sitemap and already linked from breadcrumbs on every exam page. No new sitemap entry needed (entry already exists; only `lastmod` refresh).
- Content: intro + grouped cards (Medical, Engineering, University/Aptitude, Law, Testing Services), each card = exam name, 1–2 line unique description, link to the real existing page, plus a "Mock test" link where a `job_tests` row exists (LAT, GAT, provincial MDCAT).
- Only real URLs listed above will be linked. No links to the missing/404 slugs.
- SEO: `SEOHead` title/description in the site pattern, `BreadcrumbSchema`, and an `ItemList` JSON-LD via `safeJsonLd` (consistent with `ExamLandingPage`).
- No ads on the hub in batch 1; add only after it is indexed with real content.

## Part 3 — Official sources used to verify each new university page

Facts will be read from the official admission pages before writing, and each page will cite its source with an outbound link plus a "verified on &nbsp;" line:

- NUMS — numspak.edu.pk (admissions/NET notices)
- LUMS — lums.edu.pk/admissions
- Karachi University — uok.edu.pk admissions
- Sindh University — usindh.edu.pk admissions
- IBA Sukkur — iba-suk.edu.pk / STS (sts.net.pk)
- PMDC/PM&DC — pmc.gov.pk for anything MDCAT-adjacent
If an official page does not state a fact (e.g. 2026 test date not yet notified), the page will say "not yet announced" rather than guess.

## Part 4 — Batch order

1. **Batch 1 (build now, after approval):** `/exams` hub page only. No existing page touched.
2. **Batch 2 (separate step at the end of batch 1):** point the "Admission Test" button on `CoachGreetingCard` from `/exams/mdcat` to `/exams`. One-line change, called out separately.
3. **Batch 3:** NUMS + IBA Sukkur pages (highest search intent, clearest official sources). Publish without ads, without sitemap entry.
4. **Batch 4 (after GSC shows batch 3 indexed):** Karachi University + Sindh University.
5. **Batch 5:** LUMS, then optional tail (GIKI, PIEAS, Air University, HEC GAT Subject).
6. **Batch 6 (cleanup, optional):** repoint or remove the remaining broken `/exams/*` internal links.

Each new university page mirrors the MDCAT template structure (exam body, frequency, duration, total marks, subjects, eligibility, prep tips, official link, related cross-links, tool links) but with university-specific facts, and only enters the sitemap once the content bar is met.

## Content-quality and safety rules applied

- Unique, source-verified facts per page — no MDCAT copy with names swapped.
- Thin-content bar: page ships only with all template sections filled; otherwise it stays unbuilt.
- No `AdSlot` on any new page in its first batch; ads added only after GSC confirms indexing.
- Sitemap addition happens in a follow-up step per batch, not at page creation.
- Structured data and meta patterns copied from `/exams/mdcat` conventions.

## Risks

- **AdSense low-value content** — mitigated by ads-off-until-indexed and the content bar.
- **GSC 404/soft-404 noise** — the existing `/exams` sitemap entry is currently a 404; batch 1 fixes it.
- **Duplicate/near-duplicate content** across Sindh pages — the combined `/sindh-universities-entry-test` page stays untouched; new IBA/Sindh Univ. pages get distinct, deeper, university-specific content and cross-link rather than repeat.
- **Stale dates** — dates only stated when an official notice exists, each with source and verified-on date.

## Isolation guarantee

Additive only. `/exams/mdcat`, `src/data/examData.ts` existing entries, all other exam pages, their meta, routes, and ad placements remain unchanged. The only edit to an existing file in batches 1–2 is adding one route in `src/App.tsx` and one URL string in `CoachGreetingCard`.

## Rough effort

- Batch 1 hub: small (1 new page + 1 route).
- Batch 2 button: trivial.
- Each university page: small-to-medium, dominated by source verification (web reads) rather than code. Two pages per batch.

&nbsp;

Plan approved. Proceed with Batch 1 only (the /exams hub page). Stop after Batch 1 — I'll verify it fixes the existing 404 in GSC before we move to Batch 2 (button repoint) and beyond.