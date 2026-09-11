# Two audits: IBA mock-test filling + traffic drop after 23 Aug

## Part A — IBA Community Colleges & Schools mock tests

### 1. What actually exists

- 92 mock tests exist in total. 54 of them were uploaded on 8 September — this is the IBA batch.
- All 54 are still in **draft**, so learners cannot see them yet.
- 18 of the 54 already hold questions (3,995 questions across the batch, e.g. Office Assistant 300, School Manager 300, Academic Coordinator 300, Library Assistant 200, Lab Assistant Computer 130).
- **36 are completely empty shells** — zero questions. Examples: Accountant, Accounts Officer, Auditor, Administrative Officer, Admission & Examination Officer, Assistant Hostel Warden (Male/Female), District Coordinator, ECE (Female), Elementary School Teacher (Biology, Chemistry, Computer, English, Islamiat, Physics, Social Studies, Urdu), HST (Biology, Computer, English, Physics), Lab Assistant (Chemistry, Physics), Nurse, Office Assistant (P.A/Computer Operator), Office Assistant (Admission & Examination), Physical Training Instructor, Procurement Officer, Receptionist (Female), Subject Specialist (Biology, Chemistry, General Science, Mathematics, Sindhi, Urdu).
- The background generation queue has **no pending work at all** (622 finished, 6 cancelled, 1 failed). So nothing is currently being generated for these 36 — they will stay empty until they are queued.
- Only 2 of the 174 uploaded job ads mention IBA in their title, so ad-to-test linking is thin and worth a separate pass later.

### 2. Subject scope needed

Good news: the scope is already stored on each of the 54 tests and follows one consistent 100-question pattern:

- English — 20% (grammar, sentence structure, vocabulary, comprehension)
- Reasoning / Aptitude — 10% (quantitative, analytical, logical)
- Computer / MS Office — 10% (Windows, Word, Excel, PowerPoint)
- Subject-based — 60% (Biology, Chemistry, Physics, Urdu, Sindhi, Islamiat, Accounts, Early Childhood, etc. per post)

So no new syllabus authoring is needed. The 40% shared English/Reasoning/Computer part is identical across all 54, which means it can be filled once and reused across tests instead of generated 54 times.

### 3. Proposed filling approach

- **Queue the 36 empty tests** into the existing mock-test generation queue in one batch, ordered so the highest-demand posts (teaching posts, Accounts/Audit, Office Assistant variants) go first.
- **Reuse before generating**: fill the shared 40% (English, Reasoning, Computer) from the existing question bank wherever possible; only the 60% subject part needs fresh generation.
- **Per-test target**: 200 questions (2x the 100-question test length) so each test can vary between attempts. Full batch need is roughly 7,200 questions worst case, far less after reuse.
- **Daily budget**: 300 questions/day for this batch, kept separate from the exam-season budget.
- **Approval stays manual** — generated questions land unapproved, same as today. Tests stay draft until you approve and publish.

### 4. Priority order vs MDCAT (9 days out)

Recommended order, no competition for the same key budget:

1. **MDCAT stays top.** Note: the MDCAT sprint switch is currently **off** in settings (it was configured to run until 21 September but is disabled). That is the single most important thing to fix, ahead of the IBA batch.
2. **IBA batch runs as a secondary scope**, and only from a separate lane: it fills from the existing question bank first, and takes fresh generation only from what MDCAT leaves unused each day.
3. **Hard separation**: MDCAT gets first claim on the daily free-key allowance; the IBA batch is capped at 300 questions/day and pauses automatically whenever the day's exam-season work has not finished.
4. After 20 September the IBA batch is promoted to primary scope automatically.

Nothing here changes your manual upload or approval workflow.

---

## Part B — Traffic drop after 23 August

### 1. Before vs after 23 August

The drop is real but it is **almost entirely one page**, not site-wide.

Daily visitors: 11–22 Aug climbed 98 → 138 → 205 → 236 → 429 → 307 → **476 (19 Aug)**, then 60, 68, 87 — and from 23 Aug onward it sits at 5–22/day. Pageviews follow the same shape (peak 2,015 on 17 Aug, 48 on 23 Aug).

Search Console for 11 Aug–7 Sep: 1,172 clicks and 9,706 impressions total, of which **the Junior Office Associate mock test page alone accounts for 1,091 clicks and 8,479 impressions — 93% of all clicks**. Nine of the ten top queries are JOA queries.

So: the JOA/Court-test exam window closed on 23 Aug and its search demand evaporated. Pre-campaign early-August baseline was 13–19 visitors/day, and today's 10–22/day is at or slightly above that baseline. This is a demand cliff on one exam cluster, not a site-wide loss.

### 2. MDCAT visibility (exam in 9 days)

This is the actual problem. MDCAT pages are barely visible:

- `/p/mdcat-karachi` — 341 impressions, 3 clicks, average position 6.3
- `/exams/mdcat` — 8 impressions, 2 clicks, average position 11.8
- `/mdcat-syllabus` and `/mdcat-past-papers` do not appear in the top-pages list at all

For an exam 9 days away this is far below what the JOA cluster was doing at the same distance from its exam date. MDCAT demand is there (impressions exist) but ranking is too weak to convert it.

### 3. Coverage / indexing since last check

- Homepage: "Submitted and indexed", Google's chosen canonical is the correct one, robots allows crawling, last successful crawl 5 Sep. No fetch or robots problem.
- Sitemap registered and being read.
- No new coverage errors surfaced in the Search Console snapshot.
- Caveat: the stored SEO scan is from 20 August and is stale, so it is not evidence about today. A fresh scan is needed before claiming the technical side is clean.

### 4. Versus the pre-403 baseline

The 403-crisis-era data is outside the window these tools return (Search Console gives the last 28 complete days; analytics here starts 1 August). So a direct pre-403 comparison cannot be made from available data — the closest usable reference point is the early-August 13–19 visitors/day baseline, which today's traffic matches.

### Summary

Traffic did not break — one exam cluster expired on schedule and nothing was ready to replace it. The replacement should have been MDCAT, and MDCAT's sprint switch is currently off with only 9 days left. That, plus MDCAT ranking strength, is where the next work belongs.

---

## Technical notes

- IBA rows live in `job_test_definitions` (54 created 2026-09-08, all `status='draft'`, `exam_tier` NULL); questions in `job_test_questions` keyed by `job_test_id`. Syllabus JSON already carries `sections[]` with `subject`, `topics[]`, `percentage`, `question_count`, `forbidden[]`.
- Filling path is `job_test_generation_queue` → `process-jobtest-queue`, which is separate from `scheduled-autofill` (that one fills board/topic `content_items`). So the IBA batch will not consume the topic auto-fill run target; separation is structural, not just a setting.
- Proposed new setting `mock_test_fill_sprint` (`enabled`, `scope`, `target_per_test: 200`, `daily_budget: 300`, `defer_to_exam_sprint: true`) so this batch yields to `campaign_surge` while it is active.
- Backfill `exam_tier` on the 54 new definitions so the existing quality/stem-style guards apply.
- `campaign_surge.enabled` is `false` (label "MDCAT Final Sprint (to 20 Sep 2026)", `min_multiplier: 1`, `daily_budget: 600`); `content_fill_sprint.enabled` is also `false`.
- `auto_fill_paid_budget` = 5/run, 40/day; `paid_ai_daily_ceiling` = 500/day. Neither is touched by this plan.
- Evidence: Search Console 2026-08-11→2026-09-07 snapshot; project analytics daily 2026-08-01→2026-09-11; SEO scanners `http`/`lint` stale as of 2026-08-20, `metadata_basics` never scanned.
