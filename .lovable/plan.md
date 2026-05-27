## Content Coverage & Educational Architecture Audit — MCQsAI

Read-only audit of the CURRENT system. No code changes. Findings only.

---

### 1. SEO LANDING PAGES — INVENTORY & CONNECTIVITY

17 SEO landing pages exist under `src/pages/seo/`, all routed in `src/App.tsx` (lines 322–339).

| Page | Route | Practice link target | Connected to DB MCQs? | Connected to syllabus builder? |
|---|---|---|---|---|
| MDCATPastPapers | `/mdcat-past-papers` | `/exams/mdcat` | Indirect (via ExamLanding) | No |
| MDCATSyllabus | `/mdcat-syllabus` | `/exams/mdcat` | Indirect | No |
| ECATPreparation | `/ecat-preparation` | `/exams/ecat` | Indirect | No |
| NUSTEntryTest | `/nust-entry-test` | `/exams/*` | Indirect | No |
| PunjabUniversityEntryTest | `/punjab-university-entry-test` | mostly external/exam | Partial | No |
| COMSATSEntryTest | `/comsats-entry-test` | exam landing | Partial | No |
| SindhUniversitiesEntryTest | `/sindh-universities-entry-test` | exam landing | Partial | No |
| EngineeringUniversitiesEntryTest | `/engineering-universities-entry-test` | exam landing | Partial | No |
| PSTSSTTestPreparation | `/pst-sst-test-preparation` | generic | **No** | No |
| NinthClassMCQs | `/9th-class-mcqs` | **all topic chips → `/boards`** (generic, not deep-linked) | **No** | No |
| BoardMCQs | `/board-mcqs` | **all subject chips → `/boards`** | **No** | No |
| CSSMCQs | `/css-mcqs-practice` | generic | **No** | No |
| PPSCPastPapers | `/ppsc-past-papers` | generic | **No** | No |
| FPSCPastPapers | `/fpsc-past-papers` | generic | **No** | No |
| PakArmyTest | `/pak-army-test` | generic | **No** | No |
| PAFTest | `/paf-test` | generic | **No** | No |
| ASFTest | `/asf-test` | generic | **No** | No |
| ForcesJobsTests | `/forces-jobs-tests` | generic | **No** | No |

**Key finding:** `NinthClassMCQs` lists ~40 topics (Biology/Chemistry/Physics/Math/Languages) — every one links to flat `/boards`, NOT to `/boards/:boardSlug/:classNumber/:subjectSlug/:topicSlug`. Same for `BoardMCQs`. **Massive deep-link gap.**

No SEO page calls `/question-bank`, `/custom-syllabus`, or `/quizzes` directly. Only MDCAT/ECAT funnel into `/exams/*` (programmatic graph in `semanticGraph.ts`).

---

### 2. SUBJECTS / TOPICS IN SEO PAGES BUT MISSING FROM DB

DB hierarchy (`educational_systems` → `levels` → `subjects` → `topics`) contains only:
- Sindh Text Book Board, Punjab Curriculum and Textbook Board, AKU-EB, Oxford/Cambridge O-Level, `jobs preparation crucial syllabus`, plus `Unknown` and `Test` (cleanup needed).

**Missing systems referenced by SEO pages:**

| SEO context | DB representation |
|---|---|
| MDCAT | **No educational_system row** — only loose `content_items.subject` values |
| ECAT / NUST / COMSATS / Engineering | **No system** |
| FPSC / PPSC / CSS / NTS | Only loose `Junior Clerk`, `Lecturer`, `Civil Judge`, `Banking Officer`, `Election Officer` subjects (not hierarchical) |
| Pak Army / PAF / ASF / Navy / Rangers / FIA | **Nothing** |
| PST / SST teaching tests | **Nothing** |
| Federal / KP / Balochistan / FBISE boards | **Nothing** (only Sindh + Punjab + AKU-EB) |

**Topics named in SEO pages with zero DB topic row:**
- 9th Class Biology: Bioenergetics, Cell Cycle, Nutrition, Transport, Gaseous Exchange, Support & Movement
- 9th Class Chemistry: Chemical Reactivity, Electrochemistry (Class 9 level missing)
- 9th Class Physics: Turning Effect, Thermal Properties, Transfer of Heat
- 9th Class Math: Matrices, Logarithms, Algebraic Manipulation, Linear Inequalities, Congruent Triangles
- Board Computer Science (Class 11/12 standalone): missing for most boards

---

### 3. ORPHANED CONTENT

**Pages with no inbound internal links** (checked via `rg` against `to="/<route>"`):
- `/asf-test`, `/paf-test`, `/pak-army-test`, `/forces-jobs-tests` — only referenced from `Index.tsx` Popular Exams block.
- `/pst-sst-test-preparation` — only in Index footer block.
- `/css-mcqs-practice`, `/ppsc-past-papers`, `/fpsc-past-papers` — only in Index footer.
- `/punjab-university-entry-test`, `/comsats-entry-test`, `/sindh-universities-entry-test`, `/engineering-universities-entry-test` — only in Index footer.

No SEO page links to another SEO page horizontally (except MDCAT-related pages via `prepResources` in `programmaticSeo.ts`).

**Topics with no quizzes / MCQs:**
- 524 `content_items` rows have `subject = NULL` — orphaned MCQs invisible to subject browser.
- Largest subject buckets are job-prep cadres (Lecturer 160, Junior Clerk 104, Civil Judge 100, Banking 40) but no SEO landing page maps to them.
- Most academic board topics have <30 MCQs each (only Geography 227, Land/Climate 200, History 106 reach scale).

**Quizzes with no SEO support:**
- All custom syllabus / quiz-engine usage is internal — no SEO page surfaces a "Practice now" CTA wired to `/custom-syllabus?subjects=...&topics=...`.

**Boards/discovery → practice continuation:**
- `BoardLandingPage` → `BoardClassPage` → `BoardSubjectPage` → `BoardTopicPage` hierarchy exists. SEO landing pages do NOT deep-link into this hierarchy; they dump users at `/boards`.

---

### 4. MISSING EDUCATIONAL COVERAGE (High-Search-Volume, Zero DB Presence)

| Exam / area | Missing in DB |
|---|---|
| MDCAT | No system; only loose Biology/Chem/Physics MCQs scattered |
| ECAT | No system; Math/Physics/English/Computer not grouped under ECAT |
| NTS / NAT | No system, no subjects |
| CSS Compulsory | English Essay, Précis, Current Affairs, Pak Affairs, Islamic Studies — only partial loose rows |
| CSS Optional groups (I–VII) | Not represented |
| PPSC / FPSC | Cadre subjects exist as flat names but no syllabus → topic tree |
| PMS / Punjab Tehsildar / ASI / Sub-Inspector | Nothing |
| Pak Army (ISSB, Initial Tests: Intelligence/Academic/Verbal/Non-Verbal) | Nothing |
| PAF / Navy / ASF / Rangers / FIA | Nothing |
| FBISE / Federal Board | Not in `educational_systems` |
| KP Textbook Board, Balochistan Board, AJK Board | Nothing |
| O/A-Level Cambridge (A2 level) | Only O-Level present, A-Level missing |
| Class 1, 2 (Primary foundation) | Missing across all boards |

---

### 5. ADMIN WORKFLOW GAPS

Examined `SubjectManager.tsx`, `useSubjects`, `enhancedContentService.ts`, `questionBankService.ts`, RPC `get_topic_inventory`.

| Gap | Detail |
|---|---|
| **Subject-without-system flow** | `SubjectManager` lets admin add subjects but UI does not enforce `level_id` linkage in a guided way; produces `system=Unknown` rows (visible in DB). |
| **Loose subject/topic strings** | `content_items.subject` and `content_items.topic` are free-text. 524 NULL-subject rows + many `(Subject)` parenthetical-suffix topics (e.g. "Introduction to Biology (Biology)") indicate AI generation writes denormalised strings rather than FK `topic_id`. `backfill_topic_ids()` exists but stale. |
| **No exam→syllabus mapper** | No table mapping `exam` (MDCAT/ECAT/CSS) → required `subjects[]`/`topics[]`. Admin cannot generate "all MDCAT Biology gaps" in one action. |
| **No SEO-page → topic mapping table** | `programmaticSeo.ts` and `semanticGraph.ts` are TS files; admin can't add a new SEO landing without a code deploy. |
| **Topic creation per-board** | Same topic ("Cell Cycle") must be created under every board separately — `canonical_topic_name` exists but admin UI doesn't expose canonical sharing. |
| **Generation queue scoped by topic only** | `get_autofill_queue` is per-topic threshold; no exam-level priority weighting (CSS topic with 0 MCQs ranked same as Class-3 Math topic with 0). |
| **Question type lock-in** | `question_type='mcq'` filter is hard-coded everywhere; no path for descriptive/short-answer items used in CSS, ISSB verbal. |

---

### 6. ARCHITECTURE OPPORTUNITIES (No Rebuild)

a. **Deep-link SEO pages into existing boards/exams routes.** All 17 pages currently dump users at `/boards` or `/exams/<slug>`. Wiring topic chips to existing `/boards/:boardSlug/:classNumber/:subjectSlug/:topicSlug` (already built) instantly converts SEO traffic into practice sessions — zero new infra.

b. **Add missing `educational_systems` rows** (Federal Board, FBISE, KPTBB, BBISE, AJK, plus virtual systems for MDCAT/ECAT/CSS/FPSC/PPSC/NTS/Forces). Subjects+topics then flow through existing `/boards/*` machinery and `/custom-syllabus` builder without code changes.

c. **Normalize loose `content_items.subject/topic` to `topic_id`** via existing `backfill_topic_ids()` RPC. Unlocks `get_lms_content_inventory()` reporting for the missing 524+ NULL-subject MCQs.

d. **Use `semanticGraph.ts` for reverse links.** Currently one-way (exam → SEO page). Add reverse so SEO pages get "Related exams / past papers / tools" rail automatically.

e. **Funnel discovery → practice.** Append a "Practice now (custom syllabus)" CTA pointing to `/custom-syllabus?subjects=<id>&topics=<ids>` on every BoardSubject and BoardTopic page — `CustomSyllabus` already accepts URL state.

f. **Convert SEO topic chips to query-string deep links** into `/custom-syllabus?subject=Biology&topic=Cell+Cycle` — uses existing builder, requires no new backend.

---

### 7. MATRICES & GAPS

**Missing-topic matrix (high-impact rows):**

```
Exam        | Subjects in DB | Topics in DB | Status
MDCAT       | 0 system rows  | 0            | CRITICAL
ECAT        | 0              | 0            | CRITICAL
NUST/NUMS   | 0              | 0            | CRITICAL
CSS         | partial loose  | partial      | CRITICAL
FPSC        | flat cadres    | 0 tree       | HIGH
PPSC        | flat cadres    | 0 tree       | HIGH
NTS         | 0              | 0            | HIGH
Pak Army    | 0              | 0            | HIGH
PAF/ASF/Navy| 0              | 0            | HIGH
FBISE       | 0              | 0            | HIGH
KP Board    | 0              | 0            | MEDIUM
Balochistan | 0              | 0            | MEDIUM
PST/SST     | 0              | 0            | MEDIUM
```

**Disconnected SEO pages (no deep-link into DB hierarchy):** 13 of 17 (every page except the 4 MDCAT/ECAT-flavoured ones).

**Internal-linking gaps:** No horizontal SEO ↔ SEO links; no SEO → `/custom-syllabus`; no Board topic page → SEO landing back-link; no Tools page → relevant exam SEO page.

**Recommended hierarchy (using existing schema, no rebuild):**

```
educational_systems
├─ Competitive Exams (new virtual system)
│  ├─ MDCAT / ECAT / NUST / NUMS / UHS
│  └─ subjects: Biology, Chemistry, Physics, English, Logical Reasoning
├─ Civil Services (new virtual system)
│  ├─ CSS / PMS / PPSC / FPSC / NTS
│  └─ subjects: English Essay, Pak Affairs, Current Affairs, Islamiyat, GK, optionals
├─ Forces & Defence (new virtual system)
│  ├─ Pak Army / PAF / Navy / ASF / Rangers / FIA
│  └─ subjects: Intelligence (Verbal/Non-Verbal), Academic, English, GK
├─ Teaching Tests (new)
│  └─ PST / SST / JEST / HST
└─ Existing board systems (Sindh TBB, Punjab CTB, AKU-EB, O-Level)
   + Federal Board, FBISE, KPTBB, BBISE, AJK (TO ADD)
```

Every node above is reachable through existing routes (`/boards/:slug/...`) and the existing `CustomSyllabus` builder — **no new pages required**, only data seeding plus deep-link wiring on the 13 disconnected SEO pages.

---

### CRITICAL FIX LIST (priority order, no UI/auth/branding touched)

1. Wire 13 SEO pages' topic/subject chips into existing `/boards/...` and `/custom-syllabus?...` routes.
2. Add missing `educational_systems`: Competitive Exams, Civil Services, Forces, Teaching Tests, Federal/FBISE/KP/Balochistan/AJK boards.
3. Run `backfill_topic_ids()` and clean 524 NULL-subject MCQs + the `Unknown` / `Test` system rows.
4. Add reverse entries to `semanticGraph.ts` so every SEO page renders related-content rail.
5. Add per-exam syllabus mapping table (`exam_syllabus`) so admin "Fill gaps for MDCAT" becomes a single action over existing `get_autofill_queue`.
6. Add "Practice now" CTA on `BoardSubjectPage` / `BoardTopicPage` deep-linking into `CustomSyllabus`.

This is an **audit only**. Awaiting go-ahead before any implementation.
