# Plan — Isolated Job Test System (v2)

A dedicated, AI-only pipeline for pre-announced Job Tests (Junior Clerk, etc.), fully separated from the general `content_items` bank. Admin uploads syllabus + sample reference questions; AI generates fresh per-test questions; admin approves before students see them.

> Note on rate limiting: backend has no rate-limiting primitives yet. We'll implement it ad-hoc (per-batch sleep + daily-cap counted from `job_test_generation_logs`) inside the edge function only. Not a hardened solution — flagged per platform constraint.

## Phase 1 — Database (3 new tables)

Migration creates:

`**job_test_definitions**`

- `id`, `job_title`, `department`, `status` (draft/published/archived)
- `syllabus jsonb` — `{ sections: [{ subject, percentage, question_count, topics[], style_guide, forbidden[] }] }`
- `sample_questions jsonb` — admin-curated MCQs grouped by subject
- `difficulty_distribution jsonb` (default 30/50/20)
- `min_questions_per_topic`, `max_retries`
- `created_by uuid` (no FK to `auth.users` per project rules), `created_at`, `updated_at`

`**job_test_questions**` (isolated from `content_items`)

- `job_test_id` FK CASCADE
- `subject`, `topic`, `question`, `options jsonb`, `correct_answer`, `explanation`, `difficulty`
- `generation_batch`, `validation_score numeric`, `admin_approved bool default false`
- `times_used`, `times_correct`
- Indexes on `job_test_id`, `subject`, `admin_approved`
- Difficulty enforced via **validation trigger** (per project rules — not CHECK constraint)

`**job_test_generation_logs**`

- Per-subject telemetry: `requested_count`, `generated_count`, `accepted_count`, `rejected_count`, `rejection_reasons jsonb`, `api_calls_made`, `total_cost_credits`, `generation_time_seconds`, `status`, `error_message`

**RLS** (all three):

- Admins: full access via `is_admin()`
- Authenticated users: `SELECT` on `job_test_definitions` where `status='published'`
- Authenticated users: `SELECT` on `job_test_questions` where parent definition published AND `admin_approved=true`
- Logs: admin-only

**Migration also**: copy existing `job_tests` rows into `job_test_definitions` (syllabus mapped 1:1, `status='published'`, `sample_questions=NULL`). Old `job_tests` table left intact for now.

## Phase 2 — Edge Function `generate-job-test`

Brand-new function. Input: `{ job_test_id, subject?, regenerate? }`. Flow:

1. Load `job_test_definitions` row.
2. For each section (or single subject if specified):
  - Build prompt with topics[], `forbidden[]`, `style_guide`, and 2–3 inline sample questions ("match this style").
  - Call Gemini in batches of 10, hard cap `MAX_BATCHES=3` per section.
  - Validate MCQ structure (4 options A–D, correct in A–D, non-empty explanation).
  - Per-section forbidden-keyword check (admin-defined, no global hardcoded lists).
  - Insert accepted rows into `job_test_questions` with `admin_approved=false`.
  - 2s delay between batches; daily cap per `job_test_id` (e.g. 200 generations) checked against `job_test_generation_logs`.
  - Write one log row per section.
3. Return `{ generated, accepted, rejected, log_ids }`.

No reads from `content_items`. No retries-on-zero hack — sample-anchored prompt should keep first-pass acceptance high.

## Phase 3 — Admin UI

Replace `src/components/admin/JobTestManager.tsx` with a 5-tab editor scoped to a selected definition:

- **Definition** — title, department, status, difficulty distribution.
- **Syllabus Builder** — repeatable section blocks: subject, percentage, question_count, topics (chips), style_guide, forbidden keywords (chips).
- **Sample Questions** — per-subject MCQ editor (≥2 required to publish). Bulk JSON upload supported.
- **Generated Questions** — table of `job_test_questions` filtered by subject/approved; bulk approve/delete; "Generate more" button per subject calls `generate-job-test`.
- **Generation Logs** — read-only table from `job_test_generation_logs`, latest first.

Existing bulk JSON import keeps working with the expanded schema.

## Phase 4 — Student Flow (`JobTestsTab.tsx`)

Replace `supabase.functions.invoke("generate-test", …)` with a **DB-only** read:

1. Fetch `job_test_questions` where `job_test_id = X AND admin_approved = true`, distributed by section quotas (Largest Remainder).
2. If a section pool is short → show admin-friendly empty state ("Coming soon — questions under review"). Default: no auto-top-up.
3. Build `custom_test_sessions` row exactly like today; navigate to `/test-session/:id`.
4. After submission: increment `times_used` / `times_correct` (background, non-blocking).

Cache pollution from `content_items` is structurally impossible on this surface.

## Phase 5 — Migration of legacy `job_tests`

One-time SQL block inside the same migration: copy each row → `job_test_definitions` (syllabus mapped, `sample_questions=NULL`, `status='published'`). UI stops reading `job_tests`; table dropped in a follow-up migration.

## Files


| File                                                        | Action                                                                       |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| migration                                                   | NEW — 3 tables, RLS, validation trigger, copy from `job_tests`               |
| `supabase/functions/generate-job-test/index.ts`             | NEW                                                                          |
| `src/components/admin/JobTestManager.tsx`                   | REWRITE — 5-tab editor                                                       |
| `src/components/admin/job-test/SampleQuestionsEditor.tsx`   | NEW                                                                          |
| `src/components/admin/job-test/GeneratedQuestionsTable.tsx` | NEW                                                                          |
| `src/components/admin/job-test/GenerationLogsTable.tsx`     | NEW                                                                          |
| `src/components/admin/job-test/SyllabusItemForm.tsx`        | EXTEND — topics, style_guide, forbidden chips                                |
| `src/services/jobTestService.ts`                            | EXTEND — CRUD for definitions/questions/logs, `generateForSubject()` wrapper |
| `src/hooks/useJobTestManagement.tsx`                        | EXTEND — sample_questions state, generate trigger                            |
| `src/components/mock-tests/JobTestsTab.tsx`                 | MODIFY — DB-only fetch, drop `generate-test` invocation                      |


## Risks

- **Cold start**: a freshly published test has zero approved questions. Admin must pre-generate + approve. UI gates publish on ≥2 sample questions per subject.
- **Sample quality drives output quality** — bad samples → bad questions.
- **Rate limiting is ad-hoc** (sleep + log-based daily cap). No backend primitives exist; will be revisited when platform supports it.
- **Storage growth** — each test owns its pool. Acceptable.

## Out of scope

- Touching `generate-test` or `content_items` (Subject Tests / Syllabus Builder unaffected).
- Test session player (`/test-session/:id`) — unchanged.
- AI Coach integration on Job Test answers (later, via shared `test_attempts`).
- Dropping legacy `job_tests` table (deferred to cleanup migration).

### **✅ MY ADDITIONS TO LOVABLE'S PLAN:**

#### **1. Bulk Operations:**

typescript

```typescript
// In admin review panel
const approveAll = async (subjectFilter: string) => {
  const { data } = await supabase
    .from('job_test_questions')
    .update({ admin_approved: true })
    .eq('job_test_id', currentTestId)
    .eq('subject', subjectFilter)
    .eq('admin_approved', false);
    
  toast.success(`Approved all ${data.length} ${subjectFilter} questions`);
};
```

#### **2. Question Preview Before Generation:**

typescript

```typescript
// Show estimated cost before generating
const estimateCost = (questionCount: number) => {
  const batches = Math.ceil(questionCount / 10);
  const apiCalls = batches * 1.5; // Average with retries
  const cost = apiCalls * 0.05; // $0.05 per call
  
  return {
    batches,
    apiCalls: Math.ceil(apiCalls),
    estimatedCost: cost.toFixed(2)
  };
};

// Before generate
toast.info(`
  Generating 40 questions:
  - Batches: 4
  - Est. API calls: 6
  - Est. cost: $0.30
  Continue?
`);
```

#### **3. Quality Metrics Dashboard:**

typescript

```typescript
// Admin sees quality stats
{
  "English": {
    "generated": 50,
    "approved": 38,
    "rejected": 12,
    "approval_rate": "76%",
    "avg_generation_time": "45s"
  },
  "Computer": {
    "generated": 45,
    "approved": 40,
    "rejected": 5,
    "approval_rate": "89%",
    "avg_generation_time": "50s"
  }
}
```

#### **4. Auto-Regenerate Low Quality:**

typescript

```typescript
// If approval rate < 50%, auto-flag for regeneration
if (approvalRate < 0.5) {
  toast.warning(`
    ${subject} approval rate is ${approvalRate * 100}%
    Consider:
    1. Improving sample questions
    2. Adding more forbidden keywords
    3. Updating style guide
  `);
}
```