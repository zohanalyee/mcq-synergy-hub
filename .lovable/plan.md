# Phase 4 + Advanced Personalized-Freshness — Architecture Proposal

Yeh **sirf design proposal** hai. Koi code/migration abhi nahi. Approval ke baad phase-wise banayenge.

---

## 0. Aap ke 4 requirements — feasibility (short answers)


| #   | Requirement                            | Feasible?                        | Naya schema?                                                                                                    |
| --- | -------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1   | Reuse rotation ke liye (pool > target) | Haan                             | Nahi — sirf logic change                                                                                        |
| 2   | Retake same test / naya test dono      | Haan (confirm karna hai UI mein) | Nahi                                                                                                            |
| 3   | Performance-aware freshness (mastery)  | Haan                             | **1 naya table** (mastery cache). Raw data `user_attempt_history` (is_correct already maujood) mein already hai |
| 4   | DB-exhaustion par per-user AI top-up   | Haan                             | Nahi (existing quota + `generate-job-test` reuse)                                                               |


**Bottom line:** Sab kuch existing schema ke upar sit karta hai. Sirf **ek mastery cache table** aur selection-logic upgrade chahiye. Koi destructive change nahi.

---

## 1. Requirement 1 — Rotation Pool (target × N)

**Problem abhi:** Reuse sirf deficit fill karta hai. Agar test already 180 approved rakhta hai to reuse skip, aur wohi 180 baar-baar shuffle hote hain.

**Design:**

- Har test ke liye ek **"effective pool"** banega runtime par = `test ke apne approved` **∪** `cross-source reuse candidates (same subject/topic, concept-group dedup)`.
- Target `pool_multiplier` (default **2×**, admin-tunable per test): 180-target → 300–360 ka underlying pool.
- Selection us pool se hoti hai (mastery + freshness ranking se — niche section 3).
- Agar pool < target × multiplier → deficit calculate, phir Phase 3 wala reuse-pull → phir bhi kami ho to AI (requirement 4).

**Naya schema:** kuch nahi. `job_test_definitions` mein optional `pool_multiplier NUMERIC DEFAULT 2.0` add ho sakta hai (nullable, backwards-safe).

---

## 2. Requirement 2 — Retake vs Naya Test (UI confirm)

Exploration needed — `MockTestDetail.tsx` / `TestSession.tsx` mein already "Retake" aur "Pick another test" flows hain ya nahi, plan build-phase mein 1 file read se confirm karenge. Agar missing hua to chhota UI-only add (koi backend nahi). **Effort: 0–1 hour.**

---

## 3. Requirement 3 — Mastery-Aware Freshness (core naya feature)

### Data source (already maujood)

`user_attempt_history` mein per-attempt row hai with:

- `user_id`, `question_id`, `question_fingerprint`, `is_correct`, `attempted_at`

Yani **raw mastery data pehle se collect ho rahi hai** — bas usko selection-time par efficiently query karna hai.

### Problem

Har question-selection par `user_attempt_history` ko aggregate karna (400+ questions × millions of rows) slow ho jayega. Isliye **cache table** chahiye.

### Naya table: `user_question_mastery`

```
user_id            uuid
question_id        uuid          -- content_items.id OR job_test_questions.id
question_source    text          -- 'content_items' | 'job_test_questions'
concept_group_id   uuid          -- Phase 3 wala, denormalized for fast grouping
subject            text
correct_count      int           -- kitni baar sahi
incorrect_count    int           -- kitni baar galat
last_result        boolean       -- akhri attempt sahi thi?
last_attempted_at  timestamptz
mastery_level      text          -- 'unseen' | 'learning' | 'review' | 'mastered'
updated_at         timestamptz
PRIMARY KEY (user_id, question_id)
```

**Mastery classification (tunable):**

- `unseen` — kabhi attempt nahi kiya
- `learning` — attempts hain lekin akhri wrong ya <2 consecutive correct
- `review` — 2 consecutive correct, lekin 30 din se dobara nahi dekha (spaced repetition)
- `mastered` — 3+ consecutive correct OR (last_result=true AND correct_count ≥ 3)

**Update kaise hoga:**

- Trigger on `user_attempt_history` INSERT → upsert into `user_question_mastery` (recompute counts + level).
- Alternatively: post-test batch update from `processTestCompletion` (aap ka existing central hook). Trigger simpler + reliable.

### Selection ranking (naya)

Effective pool par yeh order:

```
1. unseen           (highest priority — variety)
2. learning         (galat kiye — dobara chahiye)
3. review           (repetition due — spaced)
4. mastered         (last resort, sirf agar sab khatam)
```

Within each tier: `usage_count ASC, last_used_at ASC` (existing rotation).

**Session-level:** 1-per-concept-group cap (Phase 3 se already hai) — mastered variation choose nahi hoga agar us group ka koi unseen/learning variation available hai.

---

## 4. Requirement 4 — Controlled Per-User AI Top-Up

### Trigger condition

Jab **is user ke liye is test/subject ka effective pool** ka `unseen + learning + review` count target-count se **kam** ho jaye (yani sab kuch mastered ya near-mastered), tab:

```
IF unmastered_available < target_count THEN
  request AI generation (deficit = target - unmastered_available)
END IF
```

### Guard-rails (AI-cost explosion se bachao)

Aap ke existing `_shared/quotaManager.ts` (DAILY_QUOTA_LIMIT = 1400) already global cap hai. Uske upar **per-user** limits:

1. **Per-user daily AI top-ups:** max **1 top-up / user / test / day** (config in `system_settings`).
2. **Per-user monthly cap:** max e.g. **10 top-ups / user / month** — power-user identify karta hai.
3. **Cooldown:** ek top-up ke baad **6 hours** wait, chahe wo bhi mastered kar le (bot/abuse prevention).
4. **Global brake:** agar `DAILY_QUOTA_LIMIT` ka 80% consume ho chuka, top-ups pause (only manual test-generation continue).

### Tracking table (chhoti)

`user_ai_topup_log`:

```
user_id, test_id, subject, requested_at, questions_generated, quota_used_before
```

Reuse existing `generate-job-test` function (already reuse-first + quota-aware) — sirf ek naya invocation-mode `mode='user_topup'` add hoga jo `p_user_id` accept kare aur per-user guards check kare. **Naye questions `admin_approved=true` par save hon** (aap ke sample-review policy pe depend — safer default: `false` aur admin review, lekin aap ne "organic growth" chahi hai to `true` acceptable hai agar quality-grade filter pass ho).

---

## 5. Phase 4 (Lifecycle/Circulation Dashboard) integration

Phase 4 dashboard ab **naturally** in mastery-stats ko expose karega. Ek unified admin view:

**Per-question view:**

- Bank origin (AI/manual/reuse), created-at, concept_group_id
- Global: total attempts, unique users, correct%, overused flag
- **Mastery distribution:** kitne users ne mastered / learning / unseen
- Reused-in tests list

**Per-test view:**

- Effective pool size vs target
- Mastery heatmap: average user progress
- AI top-ups triggered (count + cost)
- Cross-reuse savings

**Per-user view (admin support tool):**

- User ke top mastered subjects
- Struggling topics (learning-tier heavy)
- AI top-ups consumed

**Sirf ek dashboard**, 3 tabs — do baar kaam nahi hoga.

---

## 6. Phased rollout (recommended)


| Phase   | Scope                                                                             | Effort      | AI-cost impact      |
| ------- | --------------------------------------------------------------------------------- | ----------- | ------------------- |
| **3.5** | Pool-multiplier (req 1) + UI retake confirm (req 2)                               | ~2 hrs      | 0                   |
| **4a**  | `user_question_mastery` table + trigger + mastery-aware selection ranking (req 3) | ~1 day      | 0                   |
| **4b**  | Per-user AI top-up mode + guard-rails + log table (req 4)                         | ~1 day      | Controlled (capped) |
| **4c**  | Admin Lifecycle Dashboard with mastery-stats (Phase 4 proper)                     | ~1–1.5 days | 0                   |


Total: **~3–4 din ka focused work**, sab additive/non-destructive.

---

## 7. Kya samajhna zaroori hai (aap ke liye plain)

- **Koi delete/hide nahi hoga.** Sab questions bank mein rehte hain — sirf ranking badalti hai per-user.
- **Casual user** ko hamesha DB se hi mile ga → **AI-cost near-zero** unke liye.
- **Power-user** jo sab mastered kar chuka ho → sirf usi ke liye AI top-up trigger (aur wo bhi capped) → naye questions permanently bank mein add → **DB organically barhta hai**.
- Existing quota-system, existing Phase 3 reuse, existing Phase 1 freshness — sab reuse honge, koi rewrite nahi.

---

## 8. Aap se approval / clarifications chahiye

1. **Mastery threshold:** "3 consecutive correct = mastered" theek hai, ya aap 2 ya 5 chahenge?
2. **AI top-up ke naye questions:** direct `admin_approved=true` (fast growth) ya `false` (aap review karein pehle)? Safer default main `false` recommend karta hoon, lekin aap ki call.
3. **Per-user monthly top-up cap:** 10 theek hai ya kam/zyada?
4. **Rollout order:** 3.5 → 4a → 4b → 4c is order mein karein, ya aap koi aur tarteeb chahenge?

Approval mile to Phase 3.5 se shuru karta hoon.

Please initiate the rollout order 3.5 

&nbsp;