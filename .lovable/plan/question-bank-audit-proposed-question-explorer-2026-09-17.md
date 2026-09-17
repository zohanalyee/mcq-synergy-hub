# Question Bank Audit + Proposed "Question Explorer"

## Part 1 — Audit findings (live data, 17 Sep 2026)

### What the admin "Question Bank" total counts today

Your suspicion is correct. The Question Bank screen counts only the general
content library (board/topic questions). It never touches the mock-test
question store. Its "total" is also an unfiltered library count, so the single
non-question row (1 past paper) is included in the headline number.

Mock-test questions are only counted in a different place (the Lifecycle
dashboard, "Approved Mock Qs"), so the two pools are never shown side by side.

### True combined total

General library (content_items, MCQs):

- Approved / live: 17,873
- Pending: 576
- Held as duplicates (hidden): 585
- Total MCQs: 19,034 (plus 1 past-paper row = 19,035 rows overall)

Mock-test bank (job_test_questions):

- Approved: 23,498
- Not approved: 50
- Total: 23,548
- Every one of these belongs to a mock test still in "draft" state; there is no
"flagged_duplicate" or "pending" concept in this table, only an approved flag.

Combined real question total: 42,582 questions
(41,371 approved / live, 626 awaiting approval, 585 held as duplicates)

So the admin screen is under-reporting the library by roughly 23.5k questions.

### Are the two pools shared or separate?

They are effectively separate pools, stored in different tables with different
approval rules.

- Only 35 mock-test questions record a link back to a general-library question.
- By exact question text, 217 distinct texts exist in both pools.
- Mock-test questions are never served in general topic practice, and library
questions are copied (not referenced) when reused for a mock test.

### Cross-context repetition already visible in the data

- 4,783 mock-test question texts appear more than once inside the mock-test bank.
- 4,639 of those texts are shared across more than one mock test. Some of this is
intentional reuse (the same skill tested in related exams), which is exactly
why a usage-based view is needed to judge it.
- 0 approved library questions appear under more than one topic, so the
cross-topic duplication risk is currently concentrated in mock tests.

## Part 2 — Proposed "Question Explorer" (admin-only)

A single spreadsheet-style table over both pools, read-first, with opt-in bulk
cleanup. Nothing here runs automatically and nothing feeds generation.

### Columns

- Question text (with a source badge: Library or Mock Test)
- Status / approval
- Subject, Topic (library tagging)
- Mock tests using it — count plus the names on hover/expand
- Also in other pool? (yes/no, with the matched counterpart)
- Copies of the same text (across the whole bank)
- Difficulty, times used, last used, created date

### Sorting and filtering

Every column sortable. Filters for pool, status, subject, topic, difficulty,
free-text search, and the relationship filters that matter:

- "Used in more than one mock test"
- "Exists in both pools"
- "Has duplicate copies" (2+, 3+, 5+ thresholds)
- "Never used"

### Bulk actions

Select rows (including select-all-matching-filter) then:

- Keep one, hold the rest as duplicates (library) or unapprove (mock tests)
- Delete selected
- Export selection to Excel/CSV
All bulk actions show a confirmation summary and are logged.

### Isolation guarantee

- Read path: one new database view/function used only by this screen.
- Write path: only explicit admin clicks. No cron, no generation hook.
- Duplicate Review keeps its own text-grouping flow untouched; Explorer is
complementary (usage-based) and does not write to its scan tables.

## Technical notes

Reused as-is: existing admin tab shell, table/badge/tooltip components, the
Excel export helper, and the existing duplicate-hold status values.

New work needed:

1. A read function that unions both pools with computed relationship counts
  (mock-test usage count, cross-pool match, duplicate-copy count), keyed on
   normalised question text, with server-side sort/filter/paging so the 42.5k
   rows never hit the 1,000-row response cap.
2. A supporting index on normalised question text in both tables for speed.
3. The Explorer screen: filter bar, sortable virtualised table, expandable
  relationship cell, selection state, bulk-action confirmation.
4. Bulk-action endpoints, admin-guarded and audit-logged.

Effort estimate: roughly 2 to 3 working sessions — about 1 for the data layer
and indexes, 1 for the table/filters, and a half for bulk actions plus
verification against live counts.

## Open decision

Whether shared mock-test questions should be treated as a problem at all. Many
of the 4,639 shared texts are likely legitimate reuse across similar exams; the
Explorer will surface them, but I would not bulk-delete them without you
reviewing a sample first.

&nbsp;

&nbsp;

# **Plan approved. Proceed with the Question Explorer build:**

1. Read function unioning both pools with computed relationship counts (mock-test usage count, cross-pool match, duplicate-copy count), server-side sort/filter/paging (no 1000-row cap issue)

2. Supporting indexes on normalized question text

3. Explorer screen: filter bar, sortable table, expandable relationship cell, selection, bulk-action confirmation

4. Bulk-action endpoints, admin-guarded and audit-logged

Also update the main admin Question Bank dashboard's total count to include mock-test questions (job_test_questions) so the headline number reflects the true combined total (42,582), not just the library count.

Isolation guarantee — read-first tool, no automatic actions, Duplicate Review's own scan/flow stays untouched. I will review a sample of the 4,639 shared mock-test texts myself before any bulk deletion — don't bulk-delete anything without my review.

Please build in batches (data layer first, then UI, then bulk actions) and stop after each for verification, same as our usual approach.