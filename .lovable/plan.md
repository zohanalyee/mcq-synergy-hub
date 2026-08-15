# Reuse Scope Guard + Today's Generation Status

## Part 1 — Aap ka shak sahi hai (confirmed)

Reuse layer `supabase/functions/generate-job-test/index.ts` mein sirf yeh checks karta hai:
subject/alias naam match, 4 options mojood, valid correct answer, difficulty normalize, duplicate text, ek concept-group se ek question. **Stem length ya genre ka koi check nahi hai.**

Iska matlab: ek CSS/competitive-level English comprehension ya "discuss/write a note" style question, agar approved bank mein hai, to **sirf subject naam "English" match hone par Court Clerk (BPS-11/13) test mein bhi copy ho sakta hai** — Item 3 ki genre guard sirf AI generation path par lagi hai, reuse path par nahi.

Live bank scan (aaj):
- `content_items` approved MCQs with stem > 180 chars: **479**
- `job_test_questions` approved with stem > 180 chars: **556**
- essay-verb stems in `job_test_questions`: **14**

Yeh 1000+ rows abhi reuse ke through kisi bhi chhote exam mein ja sakte hain.

## Part 2 — Fix (2 layers)

### A. Reuse-time style guard (turant, zero cost)
`generate-job-test` ke dono reuse loops (content_items pool + job_test_questions pool) mein `checkStemStyle(text, section.subject)` — wahi shared module jo generation use karta hai — chalayein. Fail hone wala row skip ho jayega (delete nahi hoga), aur log/`job_test_generation_logs` mein `rejection_reasons.reuse_style_rejected` count aayega. Pool query ka limit `need * 4` se `need * 6` — taake filter ke baad bhi pool bhar sake.

### B. Exam-tier scoping (ideal solution)
Naya lightweight tier tag, taake reuse cross-tier na ho:

- Migration: `exam_tier` text column `job_test_questions` aur `content_items` par (nullable), plus `job_test_definitions.exam_tier`.
- Tiers: `clerical` (BPS 5-14: Junior/Assistant/Clerk/Naib Qasid/Sub Associate), `mid` (BPS 15-17: Sub Inspector, Assistant Director, ESE/SSE, Tehsildar), `competitive` (CSS/PMS/PCS), `entry_test` (MDCAT/ECAT/NTS entry), `academic` (board classes 9-12).
- Tier derivation: `job_test_definitions.title` + BPS number se rule-based mapping (ek shared helper `_shared/examTier.ts`), aur `content_items` ke liye `exam_category` / `government_level` se.
- Backfill migration: existing rows ko unke test/exam_category se tier assign karein.
- Reuse rule: same tier hamesha allowed; **adjacent-downward** allowed nahi (default strict). Yani clerical test sirf `clerical` + tier-less rows use karega, `competitive` se kabhi nahi. Reverse bhi block — competitive test clerical questions se na bhare (quality dilution).
- Naye generated questions insert par apna tier tag lekar aayenge.

### C. Cleanup sweep (aap ki marzi se)
Existing 556 long-stem `job_test_questions` rows ko `admin_approved=false` par flag karna — sirf un tests mein jahan tier `clerical`/`mid` hai. Kuch delete nahi hoga, review queue mein chala jayega. Yeh alag button/step rahega, auto nahi.

## Part 3 — Aaj ki generation status (live data)

**1. `ai_attempt: 21` ka matlab** — yeh attempts hain, saved questions nahi. Aaj ke 24 `ai_attempt` rows mein `questions_requested`, `questions_fetched`, `questions_saved` sab **0** hain aur `subject` null hai — yani yeh sirf invocation markers hain, question counters populate nahi karte. Dashboard ko "attempts" label karna chahiye (Part 4).

**2. Aaj (15 Aug) exact inserts:**
- `content_items`: **0** questions. Aaj bilkul kuch bhi insert nahi hua.
- `job_test_questions`: **258** questions, 03:10 UTC se 09:55 UTC ke darmiyan (in mein 10 reused-from-content_items links).

**3. Wasted-run alert aaj trigger nahi hui** — kyunki kal ka fix aaj ke aakhri cron run (09:00 UTC) ke **baad** deploy hua. Aaj ke chaar auto-fill runs (00:00, 03:00, 06:00, 09:00 UTC) sab purane code par chale aur `stop_reason: "No queued topics match the sprint scope"` (sprint scope `["mdcat"]`) ke saath 0 questions par exit huay — bilkul kal jaisa. Yeh string naye code mein mojood hi nahi hai, is liye pehla real test **12:00 UTC (17:00 PKT)** ka run hoga.

Is liye plan mein ek verification step: 12:00 UTC run ke baad `auto_fill_run_summary` check karna — `stop_reason` badla, `topics_processed > 0`, aur `content_items` count barha ya nahi. Agar phir bhi 0 aaya to `get_autofill_queue` khud khali hai (depth ladder ka masla), jo alag fix hoga.

## Part 4 — Dashboard labelling (chhota)
"Today's Neural Activity" mein `ai_attempt` ko "AI attempts (not saved counts)" label, aur saath actual `content_items` + `job_test_questions` ka aaj ka insert count dikhana — taake dobara attempts ko saved questions na samjha jaye.

## Technical summary
- New: `supabase/functions/_shared/examTier.ts` (tier derivation + compatibility matrix)
- Edit: `supabase/functions/generate-job-test/index.ts` — reuse loops mein `checkStemStyle` + tier filter, tier tag on insert, logs mein reject counters
- Migration: `exam_tier` columns + backfill + index on `(subject, exam_tier, admin_approved)`
- Edit: admin dashboard component jahan "Today's Neural Activity" render hota hai (labels only)
- Verify: 12:00 UTC cron ke baad `ai_usage_logs` query
