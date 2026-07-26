# Batch 1 Audit Report — Dead Code, Architecture & AI Architecture

**Yeh sirf report hai — koi code change nahi hoga jab tak aap specific findings approve na karein.**

---

## Executive Summary (Batch 1)

- **1 High-severity finding**: 6 edge functions Gemini API ko direct call kar rahe hain, shared quota/fallback helper bypass karke → quota exhaust ho to hard-fail, aur AI-usage dashboard mein yeh calls track hi nahi hoti.
- **Koi Critical/security-hole nahi mila** is batch mein.
- **5 fully orphaned service files** (zero imports) safely delete ho sakti hain.
- **31 edge functions** hain — 2 clear consolidation candidates: `generate-test` vs `generate-job-test`, aur `rag-search` vs `search-documents`.
- **Duplicate slug utilities** 3 jagah bikhri hain (`utils/slugify.ts`, `lib/slugUtils.ts`, `lib/jobTestSlug.ts`).
- **Two toast systems** parallel chal rahe hain (sonner + shadcn) — sonner already 105 jagah use ho raha hai, shadcn wala remove ho sakta hai.
- `**subjectsData.ts` aur `subjectsData.tsx` dono coexist karte hain** — Vite resolver ambiguity ka risk.
- Sirf **1 pg_cron job** registered hai (nightly autofill) — baaqi queue-processors ka trigger-source unknown (open question).
- Koi deprecated React pattern nahi mila. Class components sirf legitimate use-cases mein hain.

---

## Master Issue Table — Batch 1


| #       | Issue                                                                     | Category  | Severity | Effort | Risk       | Plain-language explanation                                                                                                                                                                                     | Recommended fix                                                                   |
| ------- | ------------------------------------------------------------------------- | --------- | -------- | ------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **F11** | 6 edge functions Gemini ko direct call karti hain, shared fallback bypass | AI        | **High** | M      | Moderate   | `rag-search`, `search-documents`, `process-book`, `process-pdf-queue`, `enhance-content` — Gemini down/quota-out ho to yeh crash karengi bina fallback ke; aur admin dashboard mein inka usage dikhta hi nahi. | `callAIWithAutoSwitch` ya kam-se-kam `recordAIAttempt` wrapper mein route karo.   |
| **F8**  | 31 edge functions, kuch overlap                                           | Arch      | Medium   | M      | Moderate   | `generate-test` + `generate-job-test` dono MCQ banate hain alag prompts se; `rag-search` + `search-documents` dono embedding search karte hain alag code se.                                                   | Prompts/logic diff karke merge candidate identify karo.                           |
| **F1**  | 5 orphaned service files (zero imports)                                   | Dead code | Medium   | S      | Safe       | `contentStatsService`, `contentSubmissionService`, `enhancedCSVProcessor`, `sampleContentData`, `unifiedTestService` kahin use nahi ho rahi.                                                                   | Final grep confirm ke baad delete.                                                |
| **F2**  | `adminService.ts` mein 4 fake stub functions                              | Dead code | Medium   | S      | Safe       | `getTopics`/`getQuizzes`/etc return empty aur console.warn karte hain — real versions dusri services mein hain.                                                                                                | Stubs delete, agar imports mile to sahi service pe repoint.                       |
| **F14** | `generate-test` vs `generate-job-test` prompt duplication                 | AI        | Medium   | M      | Structural | Dono MCQ generate karte hain — line-by-line diff nahi kiya, but scaffolding overlap likely.                                                                                                                    | Prompts diff karo, ek template mein consolidate.                                  |
| **F5**  | Do toast systems parallel                                                 | Dead code | Low      | M      | Moderate   | `sonner` (105 usages) + shadcn `use-toast` (25 usages) — dono UI mount hote hain. Memory rule already sonner-only kehta hai.                                                                                   | Baaqi 25 usages sonner pe migrate, shadcn Toaster mount + component delete.       |
| **F3**  | 3 slug utilities scattered                                                | Dead code | Low      | M      | Moderate   | `utils/slugify.ts`, `lib/slugUtils.ts`, `lib/jobTestSlug.ts` — same responsibility 3 jagah.                                                                                                                    | Ek `lib/slugs/` module mein consolidate.                                          |
| **F6**  | `subjectsData.ts` + `.tsx` dono maujood                                   | Dead code | Low      | S      | Safe       | Extension-less import (`@/data/subjectsData`) ambiguous — Vite resolver kis file ko uthata hai clear nahi.                                                                                                     | Confirm which is live, dusra delete/rename.                                       |
| **F4**  | `mockTestUtils.ts` vs `MockTestUtils.ts` naming trap                      | Dead code | Low      | S      | Safe       | Same naam alag casing/folder — future confusion risk.                                                                                                                                                          | Component-folder wali file rename.                                                |
| **F13** | `enhance-content` mein secondary `EXTERNAL_JOBS_GEMINI_KEY` fallback      | AI        | Low      | S      | Safe       | Ek aur Gemini key kahin aur use nahi — leftover ho sakti hai.                                                                                                                                                  | Confirm karo kya key abhi bhi provisioned hai, warna cleanup.                     |
| **F12** | `ai-health` direct Gemini call                                            | AI        | Low      | —      | Safe       | Liveness ping ke liye direct call reasonable hai — F11 se exception.                                                                                                                                           | No action.                                                                        |
| **F9**  | Sirf 1 pg_cron job                                                        | Arch      | Low      | —      | —          | `process-*-queue` functions ka trigger-source pg_cron mein nahi — external ho ya manual, confirm nahi hua.                                                                                                     | Aap batayen kaise trigger hote hain, phir decide.                                 |
| **F7**  | `unifiedTestService.ts` (orphan) — possibly abandoned consolidation       | Dead code | Low      | —      | —          | 258 lines ka file jo shayad `jobTestService`+`testGenerationService` unify karne ki koshish thi.                                                                                                               | Delete se pehle ek nazar dalein — future consolidation ka blueprint ho sakta hai. |
| **F10** | Deprecated React patterns                                                 | Arch      | Info     | —      | —          | Koi class-component/legacy API misuse nahi.                                                                                                                                                                    | No action.                                                                        |


---

## Recommended Sequencing (Batch 1 Fixes)

Jab aap fixes shuru karna chahen, yeh order sujha hoon (chhota + safe pehle, structural aakhir mein):

**Group 1A — Safe cleanup (~1 turn, low credit):**

- F1 (delete 5 orphaned services) + F2 (delete stubs) + F6 (resolve subjectsData duplicate) + F4 (rename MockTestUtils)
- Sab presentation-only, koi runtime risk nahi.

**Group 1B — High-impact AI fix (~1 turn):**

- **F11** — 6 edge functions ko `callAIWithAutoSwitch` mein route karo. Yeh sabse zaroori hai (fallback + quota visibility).
- F13 (`EXTERNAL_JOBS_GEMINI_KEY` cleanup) sath kar lein.

**Group 1C — Toast consolidation (~1 turn):**

- F5 — 25 shadcn toast usages sonner pe migrate + old toast component/mount delete.

**Group 1D — Slug consolidation (~1 turn):**

- F3 — 3 slug utilities ko ek module mein merge. Careful refactor, saari 22 usages update honi hain.

**Group 1E — Structural (approval-heavy, ~2 turns):**

- F8 + F14 — `generate-test`/`generate-job-test` prompts diff, phir merge decision.
- `rag-search`/`search-documents` bhi isi group mein.
- F7 — `unifiedTestService.ts` review + delete/revive decision.

**Group 1F — Info-only:**

- F9 — aap confirm karein queue-processor functions kaise trigger hote hain (external cron? Supabase dashboard? manual admin action?). Phir zaroorat ho to formal pg_cron mein le aayein.

---

## Open Questions For You

1. **F9**: `process-pdf-queue`, `process-jobtest-queue`, `process-agent-tasks` kaise trigger hote hain? (pg_cron mein nahi hain — kya external scheduler/webhook hai ya sirf admin-triggered?)
2. **F13**: Kya `EXTERNAL_JOBS_GEMINI_KEY` naam ka secret abhi bhi Supabase mein set hai, ya purani rotation se leftover?
3. **F7**: `unifiedTestService.ts` — delete ya deep-review ke liye rakhein?

---

## Next Steps

Please batayen:

- **A**: Batch 1 findings approve — Group-by-Group fixes shuru karein (kaunse group se?)
- **B**: Batch 2 (Backend + Security) audit ab shuru karein
- **C**: Pehle open questions ke jawab doon, phir decide

**Batch 2/3/4 abhi shuru nahi hue** — is batch ka feedback milne ke baad hi agla audit chalayenge.

&nbsp;

A — Batch 1 findings approve. Group-by-group shuru karein isi order mein:

&nbsp;

Group 1A (safe-cleanup) se shuru karein, phir 1B (High-priority AI-fix — F11), phir 1C, 1D. Group 1E (structural) alag se discuss karenge baad mein.

&nbsp;

Open Questions ke jawab:

- F9: Mujhe nahi pata queue-processors kaise trigger hote hain — please khud confirm kar lein codebase check karke.

- F13: Please confirm karein EXTERNAL_JOBS_GEMINI_KEY abhi bhi Supabase-secrets mein set hai ya nahi — agar set hai aur use nahi ho raha, cleanup kar dein.

- F7 (unifiedTestService.ts): DELETE kar dein — agar zaroorat pare future mein, hum dobara bana lenge; abhi unused-code rakhna confusion hi barhata hai.

&nbsp;

Group 1A + 1B se shuru karein.