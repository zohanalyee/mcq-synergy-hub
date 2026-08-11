# Content Generation Speed & Quality Audit (Report)

All numbers below come from live DB/cron/code reads this turn.

## 1. Generation systems map

| System | Trigger | Frequency | Volume per run | Status |
|---|---|---|---|---|
| `scheduled-autofill` (topic bank fill) | pg_cron `nightly-auto-fill` | daily 02:00 UTC | hard-capped at **30 questions/night**, batch 5 per topic | **Broken — 0 runs logged in last 14 days** |
| `generate-test` | user test session, admin bulk, autofill | on demand | batch loop, per-request | Working (`user_test_session` logs daily) |
| `generate-from-rag` | autofill/admin when topic has a completed document | on demand | 5 per call | Working, rarely reached |
| `generate-job-test` + `process-jobtest-queue` | admin queue, cron every 5 min | continuous while queued | deficit-only per section | Working |
| `admin_bulk_generator` (Admin UI) | manual button | manual | 60 saved on 09 Aug | Working, only real source of new content lately |
| `convert-document-mcqs`, `process-book` | manual upload | manual | per document | Working |

Reality check: in the last 14 days the only new questions came from one manual bulk run (60 questions). Nothing automatic is producing content.

## 2. Speed bottlenecks (confirmed)

1. **Autofill is silently dead — hard blocker.** `get_autofill_queue` starts with `IF NOT is_admin() THEN RAISE`. Only `is_admin(uuid)` exists in the DB, so the no-arg call resolves with a NULL user and always returns false. The edge function runs as service_role, gets an error, reads the queue as empty, logs "All topics fully stocked", and exits. Zero `auto_fill` rows in `ai_usage_logs` confirms it.
2. **Artificial caps far below quota.** `HARD_NIGHTLY_LIMIT = 30`, `HARD_BATCH_LIMIT = 5`, `MAX_QUESTIONS_PER_CALL = 5` (autoFillService), plus a 1.5s sleep and a "already ran today" guard. Even fully working, ceiling is ~900 questions/month — reaching competitor volume would take years.
3. **Quota headroom is almost entirely unused.** `ai_daily_limit` = 1400 requests / 50,000 questions per day; Gemini 2.0 Flash free tier is ~1500 req/day with key cycling on 429. Actual usage: single-digit requests per day. We are using well under 2% of available capacity.
4. Sequential single-topic loop (one topic per iteration, one request at a time) — no parallelism.

## 3. Quality / relevance

Good news — prompts are genuinely Pakistan-grounded, not generic:
- `generate-test`: explicit board list (Punjab/Sindh/KPK/Federal/Balochistan), textbook boards, FPSC/PPSC/NTS/STS/SPSC/IBA/MDCAT/ECAT patterns, PKR/local-context rules, and explicit "NO American/British/Indian curriculum" bans.
- `generate-job-test`: Phase 7 `systemInstruction` with exam-body inference (FPSC, PPSC, NTS, PTS…).

Validation that exists: strict MCQ shape validation (exactly 4 options, correct answer present), MD5 `content_fingerprint` dedupe, `quality_grade` gating (D/F excluded from reuse), `exam_category` tagging.

Gaps: no factual second-pass verification, no board-syllabus/chapter cross-check against the actual topic's textbook chapter, and difficulty is written as a flat `'medium'` by autofill rather than a distribution.

Data-quality debt in `content_items` (MCQ rows, 8,778 total / 8,767 approved):
- **1,263 rows with NULL difficulty**
- **3,565 rows with NULL `topic_id`** (invisible to topic pages and to autofill counting)
- 1,870 rows with no `exam_category`
- 205 rows graded D/F

## 4. Gap analysis

Topic-linked approved MCQs: **5,202 across 1,853 topics**.
- **1,310 topics have ZERO questions (71%)**
- 1,332 topics under 5 (below the AdSense/indexing threshold)
- 1,553 topics under 10 (below the autofill threshold)

Worst clusters (zero-content topics):
- Punjab Board Class 9 (65), Class 12 (40), Class 11 (38), Class 10 (34)
- Sindh Board Class 12 (50), Class 11 (39), Class 9 (33), Class 10 (30)
- AKU-EB Class 6/9/10/11/12 (~30 each)
- FBISE 9th (39) and FBISE "Board MCQs (All Classes)" (32, total 0 questions)
- Competitive: MDCAT Past Papers (25), ECAT (23), NUST NET (23), PU Entry (23), COMSATS (22), Sindh Universities (22)
- Civil services: PPSC (24 zero topics, only 4 questions total), FPSC (24)
- Forces: Pak Army Test (27), PAF Test (27)

Suggested priority order (search demand x current emptiness):
1. MDCAT (past papers + Bio/Chem/Phys/English) — highest volume keyword cluster, near-empty
2. Punjab + Sindh Class 9-12 (largest board traffic, largest zero counts)
3. PPSC / FPSC / NTS general clusters (4 questions total on PPSC today)
4. ECAT / NUST / COMSATS entry tests
5. Forces (Army/PAF) — decent volume, trivial current coverage
6. AKU-EB and middle classes (5-8) last

## 5. Proposal — go fast without losing quality

Phase 1 — Unblock (highest impact, tiny change)
- Fix `get_autofill_queue` (and sibling admin-gated RPCs called from edge functions) so service_role passes, and confirm admins pass too.
- Make the autofill loop fail loudly: log a `run_summary` row per run, including "queue error" instead of silently reporting "fully stocked".

Phase 2 — Raise the throttles deliberately
- Autofill: nightly cap 30 -> configurable target (e.g. 600/night), batch 5 -> 15-20 per topic, remove the once-per-day guard, run every 3 hours.
- Keep the quota guard (1400 req/day) as the real ceiling; add key cycling on 429 as it already exists.
- Write a real difficulty distribution (60/20/20 from `auto_fill_config.difficulty_weights`) instead of hardcoded `'medium'`.

Phase 3 — "Content Fill Sprint" mode (admin one-button)
- New `content_fill_sprint` config + admin panel card: pick priority scope (exam/board/class/subject list), target per topic, daily budget, and run-days.
- A cron worker drains a persistent sprint queue in parallel batches with live progress (reuse the `job_test_generation_queue` + realtime pattern already built for mock tests).
- Auto-stops on quota, on target reached, or on quality-failure rate above a threshold.

Phase 4 — Quality gate before volume lands
- Chapter/syllabus grounding: pass the topic's board + class + chapter name into the prompt, and prefer RAG when a textbook document exists for that topic.
- Post-generation self-check pass (cheap second Gemini call, batch of 20) that flags wrong/ambiguous answers; flagged items land as `pending` for admin review instead of `approved`.
- Sprint dashboard shows accept/reject rate per subject so we can throttle whatever generates junk.

Phase 5 — Backfill existing debt
- Fill 1,263 NULL difficulty rows and re-link 3,565 NULL `topic_id` rows (canonical topic matching already exists) — this alone lifts many topics above the 5/8-question indexing thresholds with zero AI cost.
- Tag missing `exam_category`, re-grade or retire D/F rows.

## Cost estimate

Generation runs on the direct Gemini 2.0 Flash free tier (not paid gateway credits), so the constraint is requests/day, not money.

| Goal | Requests needed (20 Q/request) | Days at 1,400 req/day cap | Realistic pace |
|---|---|---|---|
| +10,000 questions | ~500 | under 1 day of quota | ~1-2 weeks with review |
| +30,000 questions | ~1,500 | ~1-2 days of quota | ~4-6 weeks with review |
| +60,000 questions (competitor parity) | ~3,000 | ~2-3 days of quota | ~2-3 months with review |

So Gemini capacity is not the limit at all — admin review throughput and the automated quality gate are. Paid gateway credits are only touched on fallback when Gemini 429s, so keeping key cycling healthy keeps credit cost ~0.

## Technical notes

- Blocker root cause: `public.get_autofill_queue(integer)` -> `IF NOT is_admin()`; only `public.is_admin(uuid)` exists, so the no-arg call evaluates against NULL and always denies.
- Caps to change live in `supabase/functions/scheduled-autofill/index.ts` (`HARD_BATCH_LIMIT`, `HARD_NIGHTLY_LIMIT`, once-per-day guard, 1500ms sleep) and `src/services/autoFillService.ts` (`MAX_QUESTIONS_PER_CALL`).
- Quota ceiling lives in `supabase/functions/_shared/quotaManager.ts` (`DAILY_QUOTA_LIMIT = 1400`) — leave as-is.
- No manual workflow changes: admin bulk generator, document converter, and mock-test queue stay untouched.
