

# AI Edge Function Integration Audit Report

This is a **read-only audit** — no code changes. All paths, columns, and function names are verified against the actual repo.

---

## PART 1 — Edge Function: `supabase/functions/generate-test/index.ts` (1733 lines)

### A. Request Parameters (verified at line 970-984)
```ts
{
  topic: string,                  // primary key for cache lookup
  difficulty: string,             // "easy"|"medium"|"hard"|"mixed"
  question_count: number,         // default 10
  forceNew?: boolean,             // skip cache
  partial_mode?: boolean,         // false = strict sync, true = return cache + bg generate
  fetch_only?: boolean,           // cache-only, no AI
  mode?: 'bank_only',             // admin bulk path
  source?: 'auto_fill',           // auto-fill flag
  topic_id?: uuid,                // FK to topics.id
  topic_ids?: uuid[],             // syllabus builder array
  session_id?: uuid,              // for syncQuestionsToSession()
  requestId?: string
}
// user_id from body is IGNORED — extracted from JWT (line 987)
```

### B. Execution Branches (in order, line 1118+)
1. **JWT auth gate** (line 929-967) — rejects no-auth, accepts service-role.
2. **`fetch_only`** → cache-only return (line 1119)
3. **`bank_only`** → AI generate + force save all to `content_items` (line 1140)
4. **Cache check** → `content_items` filtered by `category='mcq'` AND `status='approved'` AND `topic/subject ilike *kw*`
5. **FULL CACHE hit** → instant return (line 1362)
6. **PARTIAL MODE + cache>0** → return cached + `EdgeRuntime.waitUntil(backgroundGenerateAndSave)` (line 1401-1428) ⚠️
7. **FULL AI GENERATION** (sync) → `generateQuestionsInBatches` → save → return (line 1447+)

**Critical flag:** `autoPartial = partial_mode === false ? false : (usePartialMode || qc > 20)` (line 1028). Without explicit `partial_mode:false`, any request >20 silently enters background mode.

### C. Database I/O
**Reads:** `content_items` (cache + dedup), `topics` (resolve `topic_ids`→name)
**Writes:** `content_items` (insert MCQs), `ai_usage_logs` (telemetry), `custom_test_sessions` (via `syncQuestionsToSession` — merges into `questions` jsonb)

### D. Schema written to `content_items`
```ts
{
  title: q.question,
  category: 'mcq',                // not 'type'
  status: 'approved' | 'flagged_duplicate',  // not 'published'
  subject: sanitizedTopic,
  topic: topic,
  topic_id: topic_id || null,
  canonical_topic_name: slug(topic),
  difficulty: 'Easy'|'Medium'|'Hard',  // Title-cased
  options: { A, B, C, D },        // jsonb object
  correct_option: <answer text>,  // full text, not letter
  explanation: string,
  show_in_subjects, show_in_mock_tests: boolean,
  reference_material: JSON.stringify({ generator: 'ai', ... })
}
```

### E. AI Provider — `supabase/functions/_shared/gemini.ts`
- **Primary:** Direct Gemini `gemini-2.0-flash` (free, `GEMINI_API_KEY`)
- **Fallback:** Lovable AI Gateway `google/gemini-2.5-flash` (`LOVABLE_API_KEY`)
- **Vision fallback only:** `EXTERNAL_JOBS_GEMINI_KEY`
- **Auto-switch** triggers on 429/quota errors; daily UTC reset re-enables Gemini.
- **Rate limiter:** 4s between Gemini calls (in-memory, per isolate).

### F. `generateQuestionsInBatches` (line 478-690)
- `MAX_BATCH_SIZE = 15`; total split into ceil(n/15) batches.
- Hybrid dedup: normalized text set + 8-keyword fingerprint set, pre-loaded with existing DB questions.
- Per-batch: builds Pakistani exam prompt (FPSC/PPSC/NTS examples for English, Math, Computer, GK, Science, Pak Affairs) → `callGeminiForBatch` → `parseAIResponse` → dedup filter → push.
- 500ms delay between batches.

### G. Validation (`validateMCQ` line 295, `parseAIResponse` line 398)
- Accepts `correctOption` OR `correct_option`, lowercases `a-d` → `A-D`.
- Accepts options as `{A,B,C,D}` object or 4-element array; patches lowercase keys.
- Min question length: 5 chars, must produce non-empty text.
- Has JSON-repair fallback that brace-walks malformed responses.
- Logs: raw text first 500 chars + validation pass count + sample on total-fail.

### H. Response shape
```ts
{
  session_name: string,
  questions: Question[],          // {question, options[4], answer, explanation, subject, topic, difficulty}
  source: 'cache'|'cache_partial'|'hybrid'|'ai',
  cached_count, ai_count, remaining_count, total_requested,
  ai_unavailable?, error_type?, error_notice?
}
```

---

## PART 2 — Frontend Integration Map

| # | File | Mode | Notes |
|---|---|---|---|
| 1 | `src/components/mock-tests/JobTestsTab.tsx` (line 104) | **Synchronous** (`partial_mode:false`, awaited) | ✅ Uses GenerationProgressDialog, force-tags subject/topic per deficit, 60s AbortController, caps at 20 |
| 2 | `src/components/mock-tests/SubjectTestsTab.tsx` (line 106) | ⚠️ **Fire-and-forget** | Session created BEFORE AI returns; bg invoke not awaited; no `partial_mode`, relies on edge fn `session_id` sync |
| 3 | `src/components/syllabus-builder/SyllabusBuilder.tsx` (line 433) | **Synchronous** awaited; `mode:'bank_only', forceNew:true` | Generates to bank, then re-fetches via `getQuestionsWithFallbackInfo` |
| 4 | `src/pages/SubjectContent.tsx` (lines 255, 392) | **Synchronous** awaited; `partial_mode:false`, `fetch_only:true` first | DB-first; AI only on user click |
| 5 | `src/services/offlineSyncService.ts` (line 90) | `fetch_only:true` only | Cache hydration, no AI cost |
| 6 | `src/services/syllabusRAGFallback.ts` (line 80) | Calls **`generate-from-rag`** (different fn) | Awaited per topic |
| 7 | `src/pages/AskDocument.tsx` | Calls **`rag-search`** | Awaited |
| 8 | `src/components/admin/*` (AIContentFactory, EmptyTopicAnalytics) | Admin only — out of scope |

### Job Tests flow (verified, JobTestsTab.tsx)
```
User → Calculate quotas via Largest-Remainder from test.syllabus
     → For each subject (sequential, awaited):
         invoke('generate-test', { topic: subject, partial_mode:false, ... })
         force-tag returned q.subject = q.topic = item.subject  ✅
     → Insert custom_test_sessions with full questions[] jsonb
     → navigate(/test-session/:id)
```

### Subject Tests flow (current — HAZARD)
```
User → generateCustomTest() reads bank only → create session immediately
     → IF deficit>0: fire-and-forget invoke('generate-test', { session_id })
                    (edge fn writes back via syncQuestionsToSession)
     → navigate to test  ⚠️ user may start before bg writes land
```

---

## PART 3 — DB Schema Touchpoints

### `content_items` (verified from schema)
- AI uses: `category='mcq'`, `status='approved'|'flagged_duplicate'`, `topic`, `subject`, `topic_id`, `canonical_topic_name`, `options jsonb`, `correct_option text`, `difficulty` (Title case), `reference_material` (json string).
- **No `subject_id`, no `type`, no `published` status, no `source`/`content` columns** (despite earlier user prompts assuming them).

### `custom_test_sessions`
- `questions jsonb` — full Question objects, NOT IDs.
- `syncQuestionsToSession` merges by normalized question text (line 176-221).

### Fresh-question exclusion
- Frontend (`questionBankService.getUserAnsweredQuestionIds`) reads past `custom_test_sessions.questions` for the user, filters via `excludeIds`. Edge function does not filter by user.

---

## PART 4 — Flow Diagrams

```text
                  ┌──────────────────────────┐
                  │  invoke('generate-test') │
                  └────────────┬─────────────┘
                               ▼
                       JWT verified?  ──no──▶ 401
                               │ yes
                               ▼
                  parse {topic, qc, partial_mode, ...}
                               ▼
       ┌───── fetch_only? ────yes──▶ cache-only return
       │           │ no
       │           ▼
       │     bank_only? ──yes──▶ AI gen → force-save all → return stats
       │           │ no
       │           ▼
       │     Cache lookup (content_items, ilike topic/subject)
       │           ▼
       │   dbQuestions.length >= qc? ──yes──▶ INSTANT cache return
       │           │ no
       │           ▼
       │   autoPartial && cache>0?  ──yes──▶ return cache +
       │           │ no                       waitUntil(bgGenAndSave)
       │           ▼                                    │
       │   Quota check ──exhausted──▶ cache or 429    syncs to
       │           │ ok                                 session_id
       │           ▼                                    later
       │   SYNC: generateQuestionsInBatches
       │           ▼
       │   Save each (dup-check, retry up to 3, emergency save)
       │           ▼
       │   sync to session_id (if provided)
       │           ▼
       └──▶ Return { questions: cache+ai, source: hybrid|ai|cache }
```

---

## PART 5 — Bugs & Hazards Found

| # | Severity | Location | Issue |
|---|---|---|---|
| 1 | 🔴 High | `SubjectTestsTab.tsx` line 106-113 | Fire-and-forget — session created before AI completes; depends on edge fn writing back via `session_id` while user is already in TestSession |
| 2 | 🟡 Med | `generate-test/index.ts` line 1503 | Uses `partialMode` (undefined var) in console.log — should be `usePartialMode`. Causes ReferenceError in that one log line, may abort the whole sync gen path |
| 3 | 🟡 Med | `index.ts` line 1027-1028 | `qc > 20` auto-enables partial unless caller explicitly sends `partial_mode:false`. Subject Tests don't send it → silently background |
| 4 | 🟡 Med | `index.ts` line 1633 | New saves use lowercase difficulty; admin bulk save (line 1246) uses Title case — schema inconsistency in `content_items.difficulty` |
| 5 | 🟢 Low | `index.ts` line 38-39 | `normalizeDbQuestion` defaults subject/topic to `'General'` — can leak if Job Test cache hits forget to force-tag (frontend now overrides ✅) |
| 6 | 🟢 Low | `parseAIResponse` line 414 | `validateMCQ` mutates input objects (sets `correctOption` from alias) — fine but undocumented |
| 7 | 🟢 Low | `_shared/gemini.ts` line 39 | 4s rate limiter is per-isolate in-memory — multiple cold starts bypass it |

---

## PART 6 — Recommendations (no edits in this plan)

1. **Fix bug #2 immediately** — `partialMode` → `usePartialMode` in line 1503 log.
2. **Apply Strict Synchronous rewrite to `SubjectTestsTab`** mirroring `JobTestsTab`: await invoke with `partial_mode:false`, collect questions, then create session.
3. **Normalize difficulty casing** at one place in `content_items` writes (always Title case) to fix dedup mismatches.
4. **Default `partial_mode` to `false`** at the edge function unless explicitly opted in — eliminates "silent background" hazard for any future caller.
5. **Add observability:** persist `ai_usage_logs.metadata.parsed_count` alongside `questions_fetched` so admin can spot validation drops without log scraping.

---

## File Tree (AI-related, user-facing)
```
supabase/functions/
├── generate-test/index.ts         ← core MCQ engine
├── generate-from-rag/             ← RAG MCQ path (Syllabus RAG fallback)
├── rag-search/                    ← AskDocument chat
└── _shared/
    ├── gemini.ts                  ← provider auto-switch
    └── quotaManager.ts            ← daily limit gate

src/
├── components/mock-tests/
│   ├── JobTestsTab.tsx            ✅ sync
│   └── SubjectTestsTab.tsx        ⚠️ fire-and-forget
├── components/syllabus-builder/
│   └── SyllabusBuilder.tsx        ✅ sync (bank_only)
├── pages/
│   ├── SubjectContent.tsx         ✅ sync (fetch_only first)
│   └── AskDocument.tsx            ✅ sync (rag-search)
└── services/
    ├── offlineSyncService.ts      ✅ fetch_only
    ├── syllabusRAGFallback.ts     ✅ sync
    └── testGenerationService.ts   (no edge fn calls — pure DB)
```

This audit is complete. Approve to proceed with bug #2 hotfix + SubjectTestsTab rewrite (the only two items needed to close all remaining async hazards).

