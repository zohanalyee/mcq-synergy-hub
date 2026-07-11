# MCQsAI — Mock Test System Audit (A: Generation · B: Player UX)

> Deliverable only. No code will be written until you approve. Approve Part A and Part B **separately** — each has its own phased build plan at the end.

---

# PART A — Mock Test Question Generation Audit

## A1. Current State (what actually exists today)

The premise "mock tests are purely manual" is **partially outdated** — an AI pipeline already exists but is under-automated and admin has to drive it button-by-button.

**Admin authoring** (`MockTestEditor.tsx` → `job_test_definitions`)

- Per mock test admin defines: basic info, weighted syllabus, rich syllabus `sections` (subject, %, `question_count`, topics, `style_guide`, `forbidden`), `sample_questions`, and `difficulty_distribution` (default 40/40/20).
- JSON bulk import/export supported.

**AI generation** (`generate-job-test` edge function — already live)

- Reuse-first **DB precheck**: counts existing `admin_approved=true` questions per subject, computes `deficit`, and only asks Gemini for the deficit (credit-safe).
- Batched (5×10, 2s gap), Pakistan-grounded system instruction (FIA/ASF/FPSC/PPSC/NTS etc.), stores results in `job_test_questions` with `admin_approved=false`, telemetry to `job_test_generation_logs`.

**Approval queue** (`GeneratedQuestionsTable.tsx`)

- Admin triggers generation **per subject** (one button each), then filters pending/approved and approves/deletes individually.

**Player consumption** (`JobTestsTab.tsx`)

- DB-first: reads `admin_approved` questions for the definition, distributes per section via **Largest Remainder Method**, caps by unlocked level; legacy fallback to `generateCustomTest`.

## A2. Gap Analysis vs the Topic-Pages Architecture


| Capability                              | Topic pages                          | Mock tests today                               | Gap                                                 |
| --------------------------------------- | ------------------------------------ | ---------------------------------------------- | --------------------------------------------------- |
| DB-first reuse                          | Yes                                  | Yes (precheck)                                 | —                                                   |
| Deficit-only AI gen                     | Yes                                  | Yes                                            | —                                                   |
| Exclude-attempted / freshness           | Yes (usage_count, session exclusion) | Partial (unlock cap only)                      | **Add per-user attempted-exclusion to player pick** |
| One-click "fill the gap" for whole test | Yes                                  | **No — subject-by-subject only**               | **Add "Generate all sections" batch action**        |
| Auto-trigger on create                  | Nightly autofill                     | **No**                                         | **Optional: enqueue draft-gen on save**             |
| Duplicate prevention                    | MD5 fingerprint + Top-8 keyword      | **None inside job_test_questions**             | **Add fingerprint/dedup before insert**             |
| Quality gate for exposure               | ≥5 approved MCQs to index            | **None — "prepared soon" empty state only**    | **Add readiness gate + coverage check**             |
| Difficulty tagging                      | Enforced Easy/Medium/Hard            | Present but not validated against distribution | **Validate mix vs difficulty_distribution**         |
| Explanation guarantee                   | Required                             | Prompted, not enforced                         | **Reject/flag questions missing explanation**       |


## A3. Proposed Phased Plan (build only after approval)

**Phase 1 — AI-assisted draft generation for admin review (NOT auto-publish)**

- Add a single **"Generate all sections"** button in `MockTestEditor` that loops the existing `generate-job-test` deficit logic across every section (respecting `difficulty_distribution` and `question_count`), leaving everything `admin_approved=false`.
- Show a per-section coverage summary (target vs generated vs approved) so admin sees at a glance what still needs review.
- Keep 100% human approval before anything reaches players. No behavioural change to scoring.

**Phase 2 — Quality scoring + duplicate prevention**

- Before insert into `job_test_questions`: compute an MD5/keyword fingerprint and skip near-duplicates against both existing manual and AI questions for that definition (mirrors the topic-page dedup memory).
- Auto-score each draft: 4 distinct options, non-empty explanation, valid difficulty, syllabus-subject match. Surface a quality badge in the approval table; low-quality drafts sort last / flagged.
- Readiness gate: a mock test only offers "Start" when it has ≥ N approved questions covering all weighted sections (configurable; mirrors ≥5 topic threshold). Until then, keep the current "being prepared" message.

**Phase 3 — Pipeline parity with topic pages**

- Optional auto-enqueue of draft generation when a new definition is saved (agent_tasks / scheduled-autofill style), so new exams need minimal admin time.
- Player-side per-user attempted-exclusion + freshness ordering (usage_count/last_used_at) so repeat attempts feel fresh, matching topic-page freshness rotation.
- Admin Content-Health-style dashboard row for mock tests (coverage %, deficit, last generated).

**Guardrails (all phases):** never auto-publish, never change scoring/business logic, credit-safe deficit-only generation, Pakistan grounding retained.

---

# PART B — Mock Test Player UI/UX + Branding Audit

Scope: `TestSession.tsx`, `src/components/exam/*`, results block, `QuestionCard`, `QuestionPalette`. **Presentation-only recommendations — no scoring/business-logic changes.**

## B1. Findings Table


| Element                         | Current State                                                                 | Issue                                                                                                     | Recommended Fix                                                         | Priority     |
| ------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------ |
| Option select (QuestionCard)    | `ring-blue-500`, `bg-blue-500/10`, `border-blue-500/50`                       | Hard-coded blue bypasses brand violet/cyan tokens; breaks theming (violates design-system + brand memory) | Swap to `ring-primary`/`bg-primary/10`/`border-primary` semantic tokens | **Critical** |
| Analytics CTA (results)         | `bg-gradient-to-r from-purple-500 to-blue-500` inline                         | Off-brand hardcoded gradient                                                                              | Use `bg-brand-gradient` / Button variant                                | **Critical** |
| QuestionPalette states          | Hardcoded emerald/orange/red/blue                                             | Not tokenized; inconsistent w/ site + weak dark-mode contrast                                             | Map to semantic success/warning/destructive/primary tokens              | High         |
| Results pass/fail + stat colors | Hardcoded green/red/amber/blue                                                | Same tokenization gap                                                                                     | Semantic tokens                                                         | High         |
| Brand identity in player        | No logo/wordmark in exam chrome; `ExamHeader` shows test name only            | Test flow feels detached from brand (plain screen)                                                        | Add small `BrandMark iconOnly` in `ExamHeader`                          | High         |
| Option tap target               | Full card tappable (good) but flag `h-7 w-7` (28px), palette `h-8 w-8` (32px) | Below 44px mobile touch-target guidance                                                                   | Bump interactive controls to ≥40–44px on mobile                         | High         |
| Option accessibility            | `<div onClick>` no role/keyboard/aria                                         | Not keyboard-operable, no a11y semantics                                                                  | Use button semantics + `aria-pressed`, focus ring                       | High         |
| Completion feedback             | Pass banner + emoji; job-test reward dialog exists                            | No confetti/celebration on standard pass; muted "premium" moment                                          | Add subtle confetti/motion on pass (presentation only)                  | Medium       |
| Results depth                   | Score, correct/wrong/skipped, time, advice, review                            | No percentile/benchmark, no explicit weak-area breakdown chart                                            | Add weak-area-by-section summary (uses existing data)                   | Medium       |
| Social sharing                  | None on results                                                               | Missed organic-growth loop                                                                                | Add "Share my score" (image/text) button                                | Medium       |
| Timer UI                        | Text badge, pulses <60s                                                       | Functional but flat; no visual ring                                                                       | Optional circular/segmented timer; keep non-distracting                 | Medium       |
| Question text area              | `max-h-[28vh] overflow-y-auto`                                                | Nested scroll inside page scroll on mobile = awkward                                                      | Let long questions flow; reserve scroll only for extreme length         | Medium       |
| Micro-copy sizes                | `text-[10px]` labels/badges                                                   | Small; borderline readability & WCAG on mobile                                                            | Raise smallest text to ~12px                                            | Low          |
| Loading/transitions             | Skeletons + framer question slide present                                     | Good; minor flash between load→first question                                                             | Add fade-in on first question mount                                     | Low          |


## B2. Premium-Feel Roadmap — Top 5 (effort vs impact)

1. **Tokenize all player colors** (Critical, Low effort) — biggest brand-consistency win; unifies with violet/cyan brand + fixes dark mode.
2. **Brand mark in exam chrome** (High, Low effort) — keeps identity present during the core flow.
3. **A11y + 44px touch targets on options/palette/flag** (High, Low–Med) — mobile-first correctness for the founder's primary audience.
4. **Celebratory completion + weak-area breakdown on results** (Medium, Med) — "polished product" moment + actionable next step.
5. **Share-my-score on results** (Medium, Med) — organic growth loop.

## B3. Explicit Constraints

- All Part B changes are **presentation/UX only** — no changes to scoring, evaluation, unlock logic, or generation.
- Reuse existing tokens (`primary`, `brand-gradient`, `success/warning/destructive`), `glass-card`, Poppins/Orbitron per brand memory. No new fonts/colors.

---

## Next step

Tell me **"approve A"**, **"approve B"**, or both — and I'll switch to build mode and implement only the approved part, phase by phase.

&nbsp;

# **Approve A** — lekin ek zaroori requirement add kar raha hoon:

&nbsp;

Mujhe har mock test ka ek CLEAR DASHBOARD/VIEW chahiye jahan dikhe:

- Har subject/section mein KITNE questions target hain (syllabus ke mutabiq)

- KITNE already approved/ready hain

- KITNE missing/deficit hain (abhi generate nahi hue)

&nbsp;

Aur yeh zaroori hai: koi bhi question REAL-TIME (jab user test start kare) generate NA ho. Sab kuch PRE-GENERATE ho kar admin-approved hona chahiye pehle se — taake user ko koi delay/wait na mahsoos ho jab wo test start kare.

&nbsp;

Poora control mere pass rahe: main khud decide karunga kab "Generate All Sections" dabana hai aur kab approve karna hai — koi automatic/background generation na ho bina meri manzoori ke (Phase 3 ka auto-enqueue abhi ke liye skip karte hain, sirf Phase 1 + coverage-dashboard implement karein).

&nbsp;

Phase 1 mein yeh "coverage summary" component ko prominent banayen — mujhe ek nazar mein pata chal jana chahiye kaunsa test/subject abhi "incomplete" hai.

&nbsp;