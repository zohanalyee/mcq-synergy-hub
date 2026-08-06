# Fix /exams/pms noindex

## Diagnosis (verified)

This is a **bug, not an intentional gate**. There is no thin-content gate on `/exams/*` routes.

- `src/data/examData.ts` contains only 6 exams: `mdcat, ecat, css, ppsc, fpsc, nts`. There is **no `pms` entry**.
- `src/pages/exams/ExamLandingPage.tsx` renders `<NotFound />` when the slug is missing from `examsData`.
- `src/pages/NotFound.tsx` sets `noindex={true}` — so Google crawls `/exams/pms`, gets the 404 component, and sees `noindex`.
- Meanwhile `/exams/pms` is advertised in `public/sitemaps/exams.xml`, `scripts/generate-sitemaps.mjs` (`EXAM_SLUGS`), `vite.config.ts` prerender routes, and is internally linked from `semanticGraph.ts`, `CSSMCQs.tsx`, `FPSCPastPapers.tsx`, `programmaticSeo.ts`.

So the page was promoted everywhere but its content record was never added.

## Fix

Add a complete `pms` entry to `examsData` in `src/data/examData.ts`, matching the depth of the existing six (no shorter, so it does not read as thin content):

- name `PMS`, fullName "Provincial Management Service Examination"
- metaTitle / metaDescription / keywords in the same style as the CSS and PPSC entries
- description: PPSC-conducted provincial civil service exam (BS-17 posts in Punjab), plus a note that other provinces run equivalents via SPSC/KPPSC/BPSC
- eligibility: bachelor's degree, age range, provincial domicile
- subjects: English Essay, English (Precis & Composition), General Knowledge, Islamic Studies, Pakistan Affairs, Current Affairs, plus optional subjects
- tips: 5 items, same tone as CSS (daily paper reading, essay practice, Punjab-specific GK, optional-subject choice, timed mocks on MCQsAI)
- examBody: Punjab Public Service Commission, frequency, duration, totalMarks, officialUrl `https://www.ppsc.gop.pk`

No route, sitemap, or prerender changes are needed — those already point at `/exams/pms`. Once the entry exists, the page renders the real landing page with `index,follow` and its self-referencing canonical.

## After the fix

The page must be republished before Google will see the change. Then request indexing for:

```
https://mcqsai.com/exams/pms
```

I'll also confirm the built static HTML for that route contains `index,follow` (not `noindex`) as part of the existing prerender verification, so the same class of failure is caught for any other slug advertised in the sitemap but absent from `examsData`.
