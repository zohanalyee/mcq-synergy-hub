# Audit report — 23 Sep 2026 (no changes made)

All figures below are live database and Search Console readings, not estimates.

## Section 1 — the "12 mock tests with no syllabus"

I could not reproduce a set of 12. Measured state right now:

- 89 published mock tests exist, and **every one of them has a syllabus** (3–9 sections each, weightages summing to exactly 100%). None is empty.
- 92 test definitions exist behind them. **3 definitions have no published test attached**, so they have no section weightage at all — these are the only ones auto-fill cannot plan against:

| Definition | Area | Questions stored | Status |
| --- | --- | --- | --- |
| Subject Specialist – Biology Recruitment Test | Education / Teaching | 0 | empty shell, nothing generated |
| Subject Specialist – General Science | Education / Teaching | 200 (80 approved) | questions exist, no published test/syllabus |
| Official AJK MDCAT 2025 Syllabus & SZABMU Entry Test Pattern | Medical Admissions | 200 | duplicate of an already-published AJK MDCAT test |

Everything else is fine, including approval coverage: only two tests are below full approval (FIA Staff Car Driver 160/200, Vaccinator 195/200).

What is needed to unblock each:

1. **Subject Specialist – Biology** and **General Science** — these are teaching-cadre subject tests, and the bank already has 14 near-identical published siblings (Subject Specialist – Chemistry, Physics, Mathematics, Urdu, etc.) using the same 4-section shape: General/Professional English, Pedagogy, General Knowledge, Subject-Based. We can copy that proven structure directly; nothing external is needed.
2. **AJK MDCAT duplicate** — the published AJK MDCAT test already carries a 5-section official pattern. This one is a leftover copy; the safe action is to retire it rather than give it a syllabus.

If the "12" figure came from a specific admin screen, tell me which one and I will check that screen's own counting rule — the underlying data shows 3.

## Section 2 — the 4,639 shared question texts

Spread by how many mock tests share the same text:

| Shared across | Distinct texts | Rows involved |
| --- | --- | --- |
| Exactly 2 tests | 1,985 | 4,073 |
| 3–9 tests | 2,513 | 10,833 |
| 10–19 tests | 101 | 1,184 |
| 20+ tests (up to 76 copies) | 45 | 1,097 |

So the heavy repetition is concentrated: 146 texts (3%) account for ~2,280 stored rows.

Top repeated texts, with what they are:

| Text | Copies | Tests | Type |
| --- | --- | --- | --- |
| "Which of the following sentences is grammatically correct?" | 76 | 69 | English grammar |
| "Identify the grammatically correct sentence." | 60 | 51 | English grammar |
| "Which Pakistani city is known as the 'city of gardens'?" | 32 | 22 | General knowledge |
| "Choose the grammatically correct sentence." / "...:" | 31 / 28 | 25 / 27 | English grammar (same item, two punctuations) |
| Train 60 km/h in 45 minutes; money doubling at simple interest | 26 each | 26 | Arithmetic aptitude |
| MS Word undo shortcut | 24 | 24 | Computer basics |
| 13 further reasoning items (series, coding, age, profit, work-rate, direction) | 23 each | 23 | Reasoning / Aptitude |

Judgement from these examples: the repetition is **legitimate shared-syllabus content, executed wastefully**. Every one of these sits in English, General Knowledge, Computer or Reasoning sections that genuinely appear in almost all clerical/mid-tier tests — reuse is correct. Two real problems show up though:

- Near-identical rewrites of the same question ("Which of the following sentences is grammatically correct?" vs "Identify the grammatically correct sentence." vs "Choose the grammatically correct sentence." with and without a colon) — that is four separate items for one idea, and a learner taking two different tests sees the same question twice.
- The 23-copy reasoning block is one batch replicated verbatim into 23 tests, all mid-tier, so those tests have an identical aptitude section rather than varied ones.

Recommended direction (not applied): keep cross-test sharing, but treat the shared sections as one pooled bank drawn from with rotation, and merge the punctuation/wording variants. That reduces stored rows without reducing what any test can show.

## Section 3 — GSC 403 validation status

Search Console's API has no endpoint for the Page Indexing report's validation runs, so "Started / Passed / Failed" can only be read in the interface itself. What I can read is Google's own record for the affected pages, and it is good news:

- `/exams/mdcat` — **Submitted and indexed**, fetch SUCCESSFUL, last crawled 12 Sep 2026.
- `/exams/nts` — **Submitted and indexed**, fetch SUCCESSFUL, last crawled 12 Sep 2026.
- Homepage — Submitted and indexed, last crawled 19 Sep; 37 clicks / 180 impressions for 23 Aug – 19 Sep.

Both sampled pages that were previously refused are now fetched and indexed, and the crawl dates line up with the day the access rules were corrected. So the block itself is cleared; the report row will only flip once Google finishes its own re-check queue. Please glance at the row in Search Console and tell me what it says — if it still reads "Started" after this long, the cleanest move is to stop that run and start a fresh validation now that the fetches succeed.

## Suggested next steps (awaiting your go-ahead)

1. Model the two Subject Specialist syllabi on their published siblings; retire the duplicate AJK MDCAT definition.
2. Merge the grammar wording variants and rotate the shared aptitude block instead of copying it into every test.
3. Re-start the 403 validation in Search Console if it is still sitting at "Started".
