# Unique Meta Descriptions — Bing Fix

## Findings (current code state)

Most templates already build unique descriptions via template literals — the Bing scan is a stale snapshot from an earlier deploy. Verified already-unique:

- `/subject-content/[subject]` → `Free {Subject} MCQs with answers...` (SubjectContent.tsx:762)
- `/boards/.../[topic]` → `Practice {topic} MCQs for {subject} Class {n} ({board})...` (BoardTopicPage.tsx:149)
- `/boards/.../[subject]` and `/[class]` → board/level/subject-specific (BoardSubjectPage, BoardClassPage)
- `/exams/[exam]` → `Free {exam} preparation MCQs...` (ExamLandingPage.tsx:44)
- `/tools/[tool]` → per-tool `seoDescription` or `{tool} for instant results...` (ToolWrapper.tsx)
- `/scholarships/[slug]`, `/board-results`, `/analytics` → unique strings

## Genuine remaining issues to fix

**1. `/subjects` (Subjects.tsx:131)** — still uses the shared generic combined-subject list ("Practice Biology, Chemistry, Physics, English, Urdu, Mathematics MCQs..."). This is the exact duplicated string Bing flagged. Replace with a description unique to the subjects-hub page, e.g.:
`"Browse all subjects on MCQsAI — read curriculum content and practice subject-wise MCQs in Read or Practice mode for MDCAT, ECAT & board exams in Pakistan."` (~155 chars)

**2. SubjectContent.tsx:762 fallback** — when `title` is empty the `description` prop is `undefined`, so it silently falls back to the SEOHead site-wide default (`"Prepare for MDCAT, ECAT, CSS, PPSC, NTS with 6000+ MCQs..."`), shared by every page lacking a description. Change the fallback so it always yields a subject/route-aware description instead of `undefined`.

**3. SEOHead default audit** — confirm no other indexable dynamic template relies on the shared `defaultDescription`. Any that do get an explicit unique `description` prop. (Quick grep for `<SEOHead` calls without a `description`.)

## Length target

Keep each generated description ~150–160 chars where the source values allow; templates that interpolate names already scale automatically to all current and future URLs.

## Technical notes

- Pure content/presentation change — only `description=` props / template literals in page components. No data, schema, or routing changes.
- After edits, the live descriptions are correct immediately; Bing re-validates on its next crawl (the 21 flagged URLs clear once re-scanned).
- Files touched: `src/pages/Subjects.tsx`, `src/pages/SubjectContent.tsx`, plus any SEOHead caller found relying on the default during the audit.

&nbsp;

# **Approved — proceed with all 3 fixes:**

1. Fix /subjects (Subjects.tsx:131) with the unique description 

   you proposed

2. Fix SubjectContent.tsx:762 fallback so it never returns 

   undefined — always generate a subject/route-aware description 

   even when title is empty

3. Complete the SEOHead default audit — find any other indexable 

   page relying on defaultDescription and give it an explicit 

   unique description prop

Keep this as a content-only change — no schema, routing, or data 

changes as you noted. After implementing, confirm the final list 

of files changed and show me 2-3 example before/after descriptions.