# Audit & Proposal — Mock-Test Question Reuse, Freshness & Duplicate Detection

Yeh sirf audit + architecture proposal hai. Koi code abhi nahi likha jayega — approval ke baad phased-wise chalenge.

---

## PART 0 — Aap ke direct sawal ka jawab (repeat-attempt freshness)

**Confirmed gap hai.** Jab authenticated user DOBARA wahi mock test attempt karta hai:

- System `getApprovedQuestionsForDefinition()` se us test ke **saare** approved `job_test_questions` uthata hai, phir `shuffle()` + per-subject quota slice karta hai.
- **Per-user attempted-exclusion bilkul nahi hai** (jaisa topic-pages/subject-tests mein `excludeIds` ke through hai).

Iska matlab:

1. Agar pool bara hai (target se zyada questions), to repeat par **random overlap** milega — thora farq, lekin "unseen questions" ki koi guarantee nahi. Same questions dobara aa saktay hain.
2. Agar pool chhota hai (maslan test 100 mange aur bank mein bhi ~100 approved hain), to repeat par **bilkul wahi 100 questions** milenge, sirf order badla hua.

Yeh Part 3 (shared-bank) aur Part 1 (per-user exclusion) se hal hota hai. Effort chhota hai — niche estimate diya hai.

---

## PART A — Current Architecture Summary (isolated vs shared)


| Cheez                        | Job Tests (`job_test_questions`)                              | Topic Pages / Subject Tests (`content_items`)                  |
| ---------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------- |
| Storage                      | **Per-test isolated** (`job_test_id` FK)                      | **Shared central bank**                                        |
| Reuse tag                    | koi nahi                                                      | `canonical_topic_name`, `topic_id`, `subject/topic`            |
| Dedup fingerprint            | **nahi**                                                      | `content_fingerprint` (sha256 of normalized text — sirf EXACT) |
| Circulation tracking         | `times_used`, `times_correct` (per-question, jarurat par set) | `usage_count`, `last_used_at` (freshness rotation)             |
| Generation reuse             | deficit-only, magar **sirf usi test ke rows** count karta hai | DB-first pool + deficit-only AI                                |
| Per-user attempted-exclusion | **nahi**                                                      | haan (`excludeIds` + fingerprint exclusion)                    |


**DB facts (abhi):**

- 1,632 approved job-test questions, 13 tests mein.
- 8,643 approved MCQ shared bank (`content_items`) mein — job tests inhe kabhi use nahi karte.
- **27 exact-duplicate question-texts already 1 se zyada tests mein maujood hain** (redundancy ka pukhta saboot). Near-duplicate/paraphrase count is se kaafi zyada hoga.

**Nateeja:** Overlapping-syllabus tests (e.g. MDCAT variants) har baar apni alag AI-generation chalate hain, chahe same-concept question pehle se maujood ho. Yeh AI credits ka avoidable kharcha hai.

---

## PART B — Duplicate / Redundancy Findings

1. **Cross-test redundancy confirmed** — 27+ exact-text duplicates already multiple tests mein. Yeh sab alag AI calls se bane.
2. **Cross-source silos** — `job_test_questions` aur `content_items` ke darmiyan koi dedup ya reuse link nahi. 8,643 shared MCQs completely untapped hain job tests ke liye.
3. **Existing fingerprint scope** — `content_fingerprint` sirf `content_items` par, aur sirf **exact normalized-text** pakadta hai (sha256 of lowercased alphanumeric). Near-duplicate/paraphrase nahi pakadta, aur cross-source (job_test_questions) ko chhoota bhi nahi.
4. **Freshness dilution** — job tests mein `usage_count`-style rotation ya per-user exclusion na hone se chhoti population par same questions baar-baar circulate hote hain.

---

## PART C — Proposed Phased Plan

Aap ne 3 alag threads uthaye (repeat-freshness, shared-bank, deep-dedup-scan). Inhe 4 phases mein tarteeb diya hai — chhote/high-value pehle, bara structural change baad mein.

### Phase 1 — Per-user repeat-attempt freshness (chhota, high value)

**Goal:** Repeat attempt par jitna mumkin ho fresh questions.

- `JobTestsTab` selection ko `content_items` wale existing pattern par le aao: user ke pichle attempts ki question-IDs collect karke selection se exclude karo (rolling window, e.g. last N attempts), phir baaki se fill; agar pool khatam ho jaye to graceful fallback (oldest-seen pehle).
- Reuse existing `usage_count`/`last_used_at`-style ordering idea, `job_test_questions` ke liye `times_used` bump karo har attempt par.
- **Migration impact:** koi schema change zaroori nahi (attempt history `custom_test_sessions`/guest session mein already hai). Optional index for speed.
- **Effort:** chhota (frontend service + ek helper). **AI-credit impact:** zero (sirf selection logic).

### Phase 2 — Cross-source Deep-Duplicate SCAN (READ-ONLY report)

**Goal:** Poore bank (dono sources) ka duplicate map — koi merge nahi, sirf report.

- On-demand + optional nightly scan job (edge function): `job_test_questions` + `content_items` (mcq) dono fetch karo.
- Har question ka **semantic fingerprint**:
  - Tier 1 (sasta): existing normalized-text sha256 → exact duplicates instantly.
  - Tier 2 (near-duplicate): keyword-shingle / token-set similarity (Jaccard on top keywords) — koi AI cost nahi. Threshold configurable (e.g. 85%).
  - Tier 3 (optional, later): embedding-based cosine (pgvector already infra mein hai) sirf borderline pairs ke liye — cost-controlled.
- Output: ek `duplicate_scan_report` (groups, similarity, source, kitna reuse/AI-save possible). **Koi data change nahi.**
- **Migration impact:** ek naya report table. **Cost:** Tier1/2 zero AI; Tier3 optional aur borderline-only.
- **Effort:** medium. Deliverable = report jise review karke Phase 3/4 approve karenge.

### Phase 3 — Shared reuse layer for job-test generation

**Goal:** Naya test sirf GENUINELY naye topics ke liye AI kharch kare.

- `generate-job-test` precheck ko upgrade: deficit-check se **pehle** ek "cross-source reuse-check" — matching canonical-topic / subject-topic pool (`content_items` + already-approved `job_test_questions`) se pull.
- Sirf residual deficit AI se generate ho.
- **Per-test manual curation (sample_questions, style_guide, forbidden) intact rehti hai** — woh reused pool ke upar override/filter ki tarah kaam karegi (forbidden se reused questions bhi filter honge).
- Depends on Phase 2 ke canonical links (Phase 4) ya direct canonical_topic_name matching se shuru ho sakta hai.
- **Estimated AI saving:** overlapping-syllabus tests par bara — pehle se 27+ exact duplicates + hazaron untapped shared MCQs reuse honge; naye variants ka generation mostly zero ho sakta hai.

### Phase 4 — Canonical link/merge + Admin lifecycle dashboard

**Goal:** Duplicates ko canonical se link karo (delete nahi) + visibility.

- `question_canonical_links` mapping table: `duplicate_id → canonical_id` (original data safe).
- Reuse-application layer canonical pool se pull kare.
- **Admin dashboard** (topic-pages `usage_count` pattern extend karke):
  - Har question: kab bana (AI/manual), kin test(s)/topics mein use ho raha, total attempts, unique users, overused flag (dilution signal).
  - Scan-level: kitne duplicate-groups, kitna AI-generation avoid hua.
- **Migration impact:** naye tables only, koi destructive change nahi. Existing per-test isolation optional rehti hai (link layer non-breaking).

---

## PART D — Migration & Risk Notes

- Har phase **additive/non-destructive** hai — existing data delete nahi hoti, sirf reuse-relationships aur selection-logic add hoti hai.
- Generation pipelines alag rehti hain (aap ki clarified requirement) — dedup **post-generation** layer hai.
- Manual curation (sample/style/forbidden) preserved as per-test override.
- Rollback-safe: Phase 1 & 3 pure logic; Phase 2 & 4 sirf naye tables.

---

## Recommended sequencing

1. **Phase 1 abhi** (repeat-freshness fix — sabse turant user-facing benefit, chhota effort).
2. **Phase 2** report (approve karne ke liye data).
3. Phase 2 report review ke baad **Phase 3 + 4**.

Bataye kaun se phase se shuru karun — mera mashwara Phase 1 pehle, phir Phase 2 report.

&nbsp;

**Approved** — Phase 1 se shuru karein (repeat-attempt freshness fix). Chhota, koi AI-cost nahi, turant user-facing improvement.

Phase 1 complete hone ke baad, Phase 2 (deep-duplicate scan, read-only report) chalayen — mujhe exact numbers dikhayen kitne duplicates/reuse-potential hai poore bank mein.

Phase 2 report dekhne ke baad Phase 3 aur 4 par decide karunga.